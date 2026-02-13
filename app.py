import streamlit as st
import duckdb
import pandas as pd

# Configuration
DB_FILE = 'vdv_schedule.duckdb'

st.set_page_config(page_title="VDV 452 Data Explorer", layout="wide", page_icon="Bus")

@st.cache_resource
def get_connection():
    """Establishes a connection to the DuckDB database."""
    try:
        # Connect in read-only mode to prevent locking issues if script is running
        con = duckdb.connect(DB_FILE, read_only=True)
        return con
    except Exception as e:
        st.error(f"Failed to connect to database: {e}")
        return None

def main():
    st.title("VDV 452 Schedule Explorer")
    
    con = get_connection()
    if not con:
        return

    # Sidebar Navigation
    page = st.sidebar.radio("Navigation", ["Dashboard", "Data Browser", "Integrity Checks"])
    
    if page == "Dashboard":
        show_dashboard(con)
    elif page == "Data Browser":
        show_browser(con)
    elif page == "Integrity Checks":
        show_integrity_checks(con)

def show_dashboard(con):
    st.header("Dashboard")
    
    # Overview Stats
    tables = [x[0] for x in con.execute("SHOW TABLES").fetchall()]
    st.metric("Total Tables", len(tables))
    
    # Row Counts
    st.subheader("Table Row Counts")
    
    row_counts = []
    for t in tables:
        try:
            count = con.execute(f"SELECT COUNT(*) FROM '{t}'").fetchone()[0]
            row_counts.append({'Table': t, 'Rows': count})
        except:
            pass
            
    df_counts = pd.DataFrame(row_counts).sort_values('Rows', ascending=False)
    st.dataframe(df_counts, hide_index=True, use_container_width=True)

def show_browser(con):
    st.header("Data Browser")
    
    tables = [x[0] for x in con.execute("SHOW TABLES").fetchall()]
    selected_table = st.selectbox("Select Table", tables, index=tables.index('rec_frt') if 'rec_frt' in tables else 0)
    
    if selected_table:
        # Get columns
        cols = [x[0] for x in con.execute(f"DESCRIBE '{selected_table}'").fetchall()]
        
        # Filtering
        col1, col2 = st.columns(2)
        with col1:
            limit = st.slider("Limit Rows", 100, 10000, 1000)
        with col2:
            search_col = st.selectbox("Filter by Column (Optional)", ["(None)"] + cols)
        
        query = f"SELECT * FROM '{selected_table}'"
        
        params = []
        if search_col != "(None)":
            search_val = st.text_input(f"Value for {search_col}")
            if search_val:
                query += f" WHERECAST({search_col} AS VARCHAR) ILIKE ?"
                params.append(f"%{search_val}%")
        
        query += f" LIMIT {limit}"
        
        try:
            df = con.execute(query, params).df()
            st.dataframe(df, use_container_width=True)
            st.caption(f"Showing {len(df)} rows.")
        except Exception as e:
            st.error(f"Error executing query: {e}")

def show_integrity_checks(con):
    st.header("Integrity Checks")
    
    check_type = st.selectbox("Select Check", ["Orphaned Line References (lid_verlauf vs rec_lid)"])
    
    if check_type == "Orphaned Line References (lid_verlauf vs rec_lid)":
        st.markdown("Checks for entries in `lid_verlauf` that reference a Line ID (`LI_NR` + `STR_LI_VAR`) not present in `rec_lid`.")
        
        if st.button("Run Check"):
            with st.spinner("Running query..."):
                try:
                    tables = [x[0] for x in con.execute("SHOW TABLES").fetchall()]
                    if 'rec_lid' not in tables or 'lid_verlauf' not in tables:
                        st.error("Required tables (rec_lid, lid_verlauf) not found.")
                        return

                    query = """
                        SELECT v.LI_NR, v.STR_LI_VAR, COUNT(*) as occurrences
                        FROM lid_verlauf v
                        LEFT JOIN rec_lid l ON v.LI_NR = l.LI_NR AND v.STR_LI_VAR = l.STR_LI_VAR
                        WHERE l.LI_NR IS NULL
                        GROUP BY v.LI_NR, v.STR_LI_VAR
                        ORDER BY occurrences DESC
                    """
                    df_orphans = con.execute(query).df()
                    
                    if not df_orphans.empty:
                        st.error(f"Found {len(df_orphans)} orphaned line references!")
                        st.dataframe(df_orphans)
                    else:
                        st.success("Test Passed: No orphaned line references found.")
                        
                except Exception as e:
                    st.error(f"Error running check: {e}")

if __name__ == "__main__":
    main()
