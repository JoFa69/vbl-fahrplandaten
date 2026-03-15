"""
Shared SQL query building utilities.

Usage example:
    from ..utils.query_builder import WhereClause

    wc = WhereClause("s.umlauf_id IS NOT NULL AND s.umlauf_id != 0")
    wc.add_tagesart(tagesart, alias="d")
    wc.add_line_no(line_no, alias="l")

    query = f"SELECT ... FROM ... {wc} GROUP BY ..."
    result = conn.execute(query, wc.params).fetchall()
"""

from typing import Optional


class WhereClause:
    """
    Builds a parameterized WHERE clause incrementally.
    Converts to SQL string via str() or f-string interpolation.
    All user-supplied values are passed as query parameters (never interpolated).
    """

    def __init__(self, base: str = ""):
        """
        Args:
            base: Initial condition(s) without the WHERE keyword,
                  e.g. "s.umlauf_id IS NOT NULL".
                  Pass an empty string to start with no conditions.
        """
        self._conditions: list[str] = [base] if base else []
        self.params: list = []

    # ------------------------------------------------------------------
    # Common filter helpers
    # ------------------------------------------------------------------

    def add_tagesart(self, tagesart: Optional[str], alias: str = "d") -> "WhereClause":
        """Filter by tagesart_abbr. Skips if None or 'Alle'."""
        if tagesart and tagesart != "Alle":
            self._conditions.append(f"{alias}.tagesart_abbr = ?")
            self.params.append(tagesart)
        return self

    def add_line_no(self, line_no: Optional[str], alias: str = "l") -> "WhereClause":
        """Filter by li_no. Skips if None."""
        if line_no is not None:
            self._conditions.append(f"{alias}.li_no = ?")
            self.params.append(line_no)
        return self

    def add_raw(self, condition: str, *values) -> "WhereClause":
        """
        Add an arbitrary parameterized condition.
        Example: wc.add_raw("s.fahrt_typ = ?", 2)
        """
        self._conditions.append(condition)
        self.params.extend(values)
        return self

    # ------------------------------------------------------------------
    # String representation
    # ------------------------------------------------------------------

    def __str__(self) -> str:
        if not self._conditions:
            return ""
        return "WHERE " + " AND ".join(self._conditions)

    def __repr__(self) -> str:
        return f"WhereClause({str(self)!r}, params={self.params!r})"
