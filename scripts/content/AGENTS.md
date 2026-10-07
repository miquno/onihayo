# Content pipeline scripts

Scripts here import or validate learning datasets. They run only during development and CI, never
at request time. Pin source releases and checksums, validate input before writing output, and keep
each transformation deterministic and documented. Do not add a source dataset without checking its
licence and adding the required attribution and licence file beside the resulting content.
