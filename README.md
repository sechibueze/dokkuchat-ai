# DocuChat

**An evidence-grounded AI knowledge assistant for your documents.**

DocuChat is a Retrieval-Augmented Generation (RAG) system that enables individuals and teams to ask questions about their documents, retrieve relevant evidence, and receive contextual answers with source references.

The platform is designed for knowledge workers, consultants, solopreneurs, researchers, and businesses that need to find and reuse information efficiently while maintaining control over document access, AI usage, and operational costs.

## The problem

Important business knowledge is frequently distributed across PDFs, reports, policies, contracts, research papers, and internal documentation. Conventional file search helps users locate information but often leaves them to read, interpret, and combine multiple sources manually.

DocuChat turns authorized document collections into an interactive knowledge base. It retrieves relevant passages and uses an AI model to formulate an answer grounded in the available evidence.

## Features

- **Authentication:** Secure user identity and session management.
- **Authorization:** Role-based permissions, organization membership, and document-level access control.
- **Document management:** Upload, file validation, type detection, extraction, chunking, embedding, and asynchronous ingestion.
- **RAG conversations:** Natural-language questions, permission-filtered retrieval, similarity search, prompt construction, and source-backed answers.
- **Usage and cost management:** Token tracking, model usage records, budget enforcement, and cost estimation.
- **Provider flexibility:** Interfaces for LLM, embedding, storage, HTTP, and notification providers.
- **Background processing:** Redis and BullMQ workers for ingestion and other asynchronous tasks.
- **Caching and rate limiting:** TTL-based caching, tag invalidation, and configurable request limits.
- **Observability:** Correlated structured logs, Prometheus metrics, request tracing, and operational health checks.
- **Human oversight:** Configurable human-in-the-loop approval workflows.
- **MCP integration:** Controlled integration with Model Context Protocol clients and servers.
- **API documentation:** OpenAPI specifications and Swagger UI.

## Technology stack

| Area                    | Technology                                          |
| ----------------------- | --------------------------------------------------- |
| Runtime                 | Node.js                                             |
| Language                | TypeScript                                          |
| API                     | Express.js, REST                                    |
| Database                | PostgreSQL                                          |
| ORM and migrations      | Prisma 7                                            |
| Vector search           | pgvector                                            |
| Validation              | Zod                                                 |
| Logging                 | Winston                                             |
| Cache and queue backend | Redis                                               |
| Job processing          | BullMQ                                              |
| HTTP client             | Axios                                               |
| Testing                 | Vitest, Supertest                                   |
| Metrics                 | Prometheus                                          |
| API documentation       | OpenAPI, Swagger UI                                 |
| File storage            | S3-compatible object storage                        |
| PDF extraction          | pdf-parse, subject to supported-format verification |

## Prerequisites

Install and configure:

- A supported Node.js LTS release and npm.
- PostgreSQL with a compatible pgvector extension when vector search is enabled.
- Redis for caching, rate limiting, and background queues.
- An OpenAI API key for the initial model provider.
- An object-storage account or local S3-compatible development service.
- Git and a code editor.

Exact runtime and package versions will be pinned and documented during project setup.

## Getting started

The installation guide will be completed and verified during Stage 1. The intended workflow is:

1. Clone the repository.
2. Install dependencies.
3. Configure and validate environment variables.
4. Start PostgreSQL and Redis.
5. Apply Prisma migrations.
6. Start the development API server.
7. Run automated tests and code-quality checks.

Do not place API keys or other secrets in source control. Use `.env.example` to document required configuration without exposing real credentials.

## API documentation

Swagger UI will be available at:

`/api/docs`

The OpenAPI specification will describe route parameters, request validation, response envelopes, authentication requirements, authorization expectations, and common errors.

The final endpoint inventory will be maintained as routes are implemented and tested.

## Authentication and authorization

Protected endpoints require an authenticated identity. Authorization will be enforced at the application-service and data-access boundaries, not merely in the client interface.

The authorization model will support organizations, memberships, roles, permissions, and document-level access rules. Retrieval must apply these rules before returning document chunks to the generation pipeline.

Authentication tokens and secrets must never be written to application logs. Token storage, expiry, revocation, and refresh behavior will be defined in the authentication implementation.

## Architecture

DocuChat begins as a modular monolith with independently scalable background workers.

Major domains include:

- Identity and access control.
- Document ingestion and storage.
- Retrieval and embeddings.
- Conversations and LLM orchestration.
- Usage accounting and budgets.
- Notifications, audit, and observability.

Provider adapters keep the application independent of a single LLM, embedding, storage, or notification vendor.

## Testing and code quality

The project will use:

- Vitest for unit and integration tests.
- Supertest for HTTP endpoint tests.
- TypeScript type checking.
- ESLint for static analysis.
- Prettier for consistent formatting.
- Automated migration and integration checks.

Security-sensitive paths must include tests for invalid input, unauthorized access, cross-organization isolation, and unexpected provider failures.

## Contribution

Contributions should follow the established project conventions.

1. Create a focused branch.
2. Describe the change and its rationale.
3. Add or update tests.
4. Run formatting, linting, type checking, and relevant tests.
5. Update documentation when public API contracts or architecture change.
6. Submit a pull request for review.

Do not commit secrets, private documents, generated credentials, or production data.

## License

**License: TBD.** A license must be selected before the project is distributed publicly. Until then, do not assume that the source is available for unrestricted reuse.

## Support

Report bugs and request features through the repository's issue tracker once it is configured. Security vulnerabilities should be reported privately through an established security contact rather than disclosed publicly before remediation.

## Project status

Under active development. The architecture, API contracts, security controls, and operational procedures will be implemented and verified incrementally.
