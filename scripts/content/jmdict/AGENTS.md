# JMdict importer

The importer reads a publisher-provided JMdict archive, verifies its pinned SHA-256 before
decompression, and emits only explicitly selected entry sequence numbers. Keep parsing limited to
the fields Onihayo uses, reject missing or duplicate selections, and preserve the source sequence
as a stable record ID and source reference. Tests use small hand-written XML fixtures; never copy
dictionary entries into fixtures beyond what is needed to test the transformation.
