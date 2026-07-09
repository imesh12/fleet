# Organization Model

## Core Concepts
- `Organization`: tenant/company/operator using the platform
- `OrganizationUser`: membership of a global `User` inside an organization
- `OrganizationSetting`: tenant-scoped configuration for future modules

## `Organization`
- `id`
- `name`
- `code`
- `legalName`
- `email`
- `phone`
- `taxIdentifier`
- `status`
- `createdAt`
- `updatedAt`

## `OrganizationUser`
- `id`
- `organizationId`
- `userId`
- `role`
- `status`
- `createdAt`
- `updatedAt`

Role enum:
- `OWNER`
- `ADMIN`
- `MEMBER`
- `VIEWER`

Status enum:
- `ACTIVE`
- `INVITED`
- `SUSPENDED`
- `DISABLED`

## `OrganizationSetting`
- `id`
- `organizationId`
- `key`
- `value`
- `valueType`
- `category`
- `isSecret`
- `description`
- `createdAt`
- `updatedAt`

## Relationships
- one `Organization` has many `OrganizationUser`
- one `User` can belong to many organizations through `OrganizationUser`
- one `Organization` has many `CustomerAccount`
- one `Organization` has many `OrganizationSetting`
