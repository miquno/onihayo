/** A third-party package in the production build, as listed on the Licences page. */
export interface BundledPackage {
  name: string;
  version: string;
  /** SPDX licence identifier from the package's package.json. */
  licence: string;
  /** The package's licence file, verbatim. */
  text: string;
  /** Code the package ships without installing it as a dependency. */
  note?: string;
}
