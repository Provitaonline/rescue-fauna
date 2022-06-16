# rescue-faune

This utility extracts the content from the [fauna-archive]() leaf files and generates json equivalents.

The ```fauna-archive``` directory needs to be a sibling directory to the ```rescue-fauna``` directory

First, run ```./list_species.sh > files.txt``` to generate list of files to parse

Then, run ```node parse-files.js```

The ```output``` directory will contain the result.
