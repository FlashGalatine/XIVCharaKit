# Security policy

This is a private development package at version 0.0.0. No stable release is supported yet. The [threat model](docs/security/THREAT_MODEL.md) and [validation evidence](docs/implementation-progress.md) describe implemented controls, tested environments and remaining limits; they are not a security certification.

## Reporting

As checked on 2026-10-20, this repository's GitHub private vulnerability reporting is disabled, and no confidential reporting address has been verified for this project. Establishing and documenting that route remains a release gate. Do not assume that a public issue or PR is confidential, or attach private character exports, credentials or exploit payloads there.

Maintainers must choose and verify a confidential reporting route before a public package release, then update this policy with that route, supported versions and response expectations. This development milestone does not enable account settings or invent a contact address.

## Release boundaries

The CI workflow uses read-only repository permissions, synthetic fixtures and mocked APIs, and retains only the checked tarball and static demo artifacts. Publication and deployment need separate authorization, resolved code/data rights and verified production-host headers. A local workerd or preview check does not certify an eventual server host, browser origin or deployed configuration.
