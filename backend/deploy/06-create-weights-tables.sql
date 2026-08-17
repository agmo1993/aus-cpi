-- Deploy flipr:06-create-weights-tables to pg

BEGIN;

-- Table for CPI weights by category (Appendix 1)
CREATE TABLE auscpi.cpi_weights (
    id SERIAL PRIMARY KEY,
    category text NOT NULL,
    parent_category text NULL,
    weight_2025 decimal NULL,
    weight_2024 decimal NULL,
    pp_change decimal NULL,
    UNIQUE (category)
);

-- Table for Housing group weights by capital city (Appendix 2)
CREATE TABLE auscpi.housing_weights_by_city (
    id SERIAL PRIMARY KEY,
    component text NOT NULL,
    sydney decimal NULL,
    melbourne decimal NULL,
    brisbane decimal NULL,
    adelaide decimal NULL,
    perth decimal NULL,
    hobart decimal NULL,
    darwin decimal NULL,
    canberra decimal NULL,
    australia decimal NULL,
    UNIQUE (component)
);

COMMIT;
