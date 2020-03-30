CREATE TABLE ec_tenant (
    id                      SERIAL PRIMARY KEY
);
ALTER SEQUENCE ec_tenant_id_seq RESTART WITH 1000;

CREATE TABLE ec_entity (
    id                      BIGINT NOT NULL GENERATED ALWAYS AS IDENTITY,
    tenant_id               BIGINT NOT NULL,
    entity_type             VARCHAR(32),
    uuid                    VARCHAR(36) NOT NULL,
    props                   JSONB NULL,
    created_at              TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at              TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    previous                BIGINT NULL,
    parent                  BIGINT NULL,
    parent_type             VARCHAR(32) NULL,
    is_last_child           BOOLEAN NOT NULL DEFAULT FALSE
);

-- Entity

-- uuid
CREATE UNIQUE INDEX ec_idx_entity_uuid ON ec_entity (tenant_id, uuid);

-- previous
CREATE INDEX ec_idx_entity_previous ON ec_entity (tenant_id, entity_type, previous);
-- parent
CREATE INDEX ec_idx_entity_parent ON ec_entity (tenant_id, entity_type, parent_type, parent);

-- PROPS INDEXES

-- User Entity
-- email
CREATE UNIQUE INDEX ec_idx_user_email ON ec_entity (tenant_id, entity_type, (props->>'email')) WHERE (entity_type = 'User');

-- LoginSesison Entity
-- refreshToken
CREATE UNIQUE INDEX ec_idx_login_session ON ec_entity (tenant_id, entity_type, (props->>'refreshToken')) WHERE (entity_type = 'LoginSession');