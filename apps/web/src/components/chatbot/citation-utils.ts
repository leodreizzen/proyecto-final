/**
 * Global regex for finding all citations in a text.
 * Captures: [full, tag, id]
 */
export const CITATION_REGEX_GLOBAL = /\{\{([^-]+)-([^}]+)}}/g;

/**
 * Regex for splitting text into parts, preserving the citation as a part.
 * Captures the whole citation so it is included in the split array.
 */
export const CITATION_SPLIT_REGEX = /(\{\{[^-]+-[^}]+}})/g;

/**
 * Regex for parsing a single citation string.
 * Captures: [full, tag, id]
 */
export const CITATION_PARSE_REGEX = /\{\{([^-]+)-([^}]+)}}/;
