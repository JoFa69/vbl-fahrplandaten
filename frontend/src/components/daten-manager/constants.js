export const VDV_DB_MAPPING = [
    { raw: 'rec_frt.x10', db: ['cub_schedule', 'dim_fahrt'], desc: 'Fahrten' },
    { raw: 'rec_frt_hzt.x10', db: ['cub_route'], desc: 'Fahrt-Haltezeiten' },
    { raw: 'rec_lid.x10', db: ['dim_line'], desc: 'Linien' },
    { raw: 'rec_ort.x10', db: ['dim_ort'], desc: 'Haltestellen' },
    { raw: 'lid_verlauf.x10', db: ['dim_route', 'cub_route'], desc: 'Linienverlauf' },
    { raw: 'sel_fzt_feld.x10', db: ['cub_route'], desc: 'Fahrzeitfelder' },
    { raw: 'firmenkalender.x10', db: ['dim_date'], desc: 'Kalender' },
    { raw: 'rec_umlauf.x10', db: ['dim_umlauf'], desc: 'Umläufe' },
    { raw: 'rec_hp.x10', db: ['dim_ort'], desc: 'Haltepunkte' },
    { raw: 'rec_sel.x10', db: ['cub_schedule'], desc: 'Selektionen' },
    { raw: 'rec_sel_zp.x10', db: ['dim_time'], desc: 'Zeitprofile' },
    { raw: 'rec_znr.x10', db: ['dim_time'], desc: 'Zeitprofilnummern' },
    { raw: 'menge_tagesart.x10', db: ['dim_date'], desc: 'Tagesarten' },
    { raw: 'menge_fgr.x10', db: [], desc: 'Fahrgastgruppen' },
    { raw: 'menge_fahrtart.x10', db: [], desc: 'Fahrtarten' },
    { raw: 'menge_fzg_typ.x10', db: [], desc: 'Fahrzeugtypen' },
    { raw: 'menge_bereich.x10', db: [], desc: 'Bereiche' },
    { raw: 'menge_onr_typ.x10', db: [], desc: 'Ortsnummerntypen' },
    { raw: 'menge_ort_typ.x10', db: [], desc: 'Ortstypen' },
    { raw: 'basis_ver_gueltigkeit.x10', db: [], desc: 'Versionen' },
    { raw: 'menge_basis_versionen.x10', db: [], desc: 'Basisversionen' },
];

export const REMOVABLE_TABLES = new Set([
    'cub_agg_raw_data', 'cub_raw_data', 'dim_vehicle', 'raw_data', 'proc_etlrun',
]);
