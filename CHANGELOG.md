# 1.0.0
## New
- Service Account auth support
- Option to return all worksheets
- Options to ignore columns or rows
- Option to choose header line (disabling auto-detection)
- Support for multiple lines in header (sub-header, merged cells handling)

## Changes
- Removed user/password auth method (BREAKING)

# 0.3.0
## New
- Multiple worksheet selection

# 0.2.0
## New
- Node API
- Direct output (`stdout`) when not specifying file path
- Custom or predefined property name generation methods
- Worksheet selection by title
- Option to include header (first line or column) when using "list-only" option

## Changes
- Added some tests

# 0.1.6
## Fixes
- Empty first rows (or columns, if vertical) prevented properties from being detected

# 0.1.4 & 0.1.5
Needed for some fixes on the package

# 0.1.3
## New
- OAuth 2.0 support

# 0.1.2
## Fixes
- Wrong lists creation caused by empty cells, when using "list-only" option

# 0.1.1
## Changes
- Better error handling

# 0.1.0
First release
