import { Suite } from "./Suite.model";

export interface ExportedSuite {
    TYPE: 'APICSuite',
    value: Suite
}