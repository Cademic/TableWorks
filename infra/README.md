# Infrastructure as Code

This directory contains infrastructure provisioning modules for ASideNote.

## Structure

```
infra/
  environments/
    dev.tfvars        -- Development environment parameters
    staging.tfvars    -- Staging environment parameters
    prod.tfvars       -- Production environment parameters
  modules/
    database/         -- PostgreSQL provisioning module
    networking/       -- VPC / subnet / security group module
  main.tf             -- Root module (to be implemented)
  variables.tf        -- Input variable declarations
  outputs.tf          -- Output value declarations
```

## Status

This is a scaffold for future IaC implementation. The application currently uses
Docker Compose for local development (see `Source/Backend/docker-compose.yml`).

## Design Decisions

- **Tool choice**: To be decided (Terraform, Pulumi, or cloud-native CDK).
- **Database provisioning**: Module should create the PostgreSQL instance, configure
  networking, set up backup schedules, and output connection parameters.
- **Environment separation**: Each environment gets its own parameter file with
  appropriate sizing, retention, and security settings.
- **Schema management**: EF Core migrations are applied via CI/CD pipeline, not IaC.
  IaC provisions the empty database; the application migration tooling owns the schema.
