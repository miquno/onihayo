# Architecture decision records

An ADR records one significant decision: its context, the decision, the alternatives, and the consequences. ADRs are numbered and never renumbered. To change a decision, write a new ADR that supersedes the old one and update the old one's status.

Write an ADR when a change adds a runtime dependency with lasting impact, changes a trust boundary, introduces a new kind of data or storage, imports a new content source, or picks between architectural alternatives.

| #                                                  | Title                                                | Status                        |
| -------------------------------------------------- | ---------------------------------------------------- | ----------------------------- |
| [0001](0001-web-stack.md)                          | Web application stack                                | Accepted                      |
| [0002](0002-guest-first-learning.md)               | Guest-first learning; accounts as a later milestone  | Accepted                      |
| [0003](0003-content-as-versioned-data.md)          | Learning content as versioned data in the repository | Accepted                      |
| [0004](0004-postgresql-and-drizzle.md)             | PostgreSQL and Drizzle for server-side user data     | Accepted (implemented in 0.9) |
| [0005](0005-dependency-and-supply-chain-policy.md) | Dependency and supply-chain policy                   | Accepted                      |
| [0006](0006-code-and-content-licensing.md)         | Code and content licensing                           | Proposed                      |
| [0007](0007-hosting-provider-and-region.md)        | Hosting provider and region                          | Proposed                      |

## Template

```markdown
# NNNN. Title

- Status: Proposed | Accepted | Superseded by NNNN
- Date: YYYY-MM-DD

## Context

## Decision

## Alternatives considered

## Consequences
```
