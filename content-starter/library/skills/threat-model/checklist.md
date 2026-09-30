# Trust boundary checklist

Answer for each boundary. Cite code.

## Identity
- How is the caller identified? Where is that checked?
- Can identity be forged or replayed (tokens without expiry, predictable ids, missing signature checks)?

## Input
- What formats cross this boundary (JSON, YAML, files, SQL fragments, shell arguments, templates)?
- Where is each parsed? Is the parser configured safely (no external entities, no arbitrary object construction, size limits)?
- Is input ever concatenated into a query, command, path or template?

## Authorisation
- After identity, what decides whether the action is allowed? Is it enforced on every path, including bulk and admin endpoints?
- Can an object id from one tenant reach another tenant's data?

## Secrets and data
- What secrets does this component hold? Where do they come from and where could they leak (logs, errors, crash dumps, URLs)?
- What personal or sensitive data crosses here? Is it encrypted in transit and at rest?

## Logging and repudiation
- Are security-relevant actions logged with who, what, when? Can the log be altered by the actor?

## Availability
- What is the largest input this boundary accepts? What happens at 10x that?
- Are there unbounded loops, recursion on user data, or missing timeouts on outbound calls?

## Dependencies
- Which third-party components sit on this boundary? Are versions pinned? Is there a lock file?
