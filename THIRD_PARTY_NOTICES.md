# Third-party notices

The project's original library, demo and tooling code is licensed under MIT; see `LICENSE` (also included in the package's `dist` directory). Third-party notices and rights remain separate from that grant.

## XIV Dye Tools

Palette layout, appearance interpretation, and equipment query/row conventions were adapted from `FlashGalatine/xivdyetools`, commit `b98c8584a85f5dc50b4b4392c508cc627ef004d6`. Source locations and hashes are recorded in the palette metadata, data-provenance documentation, and implementation plan. The adapted source code is supplied under the following upstream code notice:

MIT License

Copyright (c) 2025 Flash Galatine

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.

## Game-derived palette and dye-name data

FINAL FANTASY XIV © SQUARE ENIX. All Rights Reserved.

This is an independent community project and is not affiliated with, sponsored by, or endorsed by Square Enix. FINAL FANTASY XIV and related names and materials belong to Square Enix and their respective rights holders.

The palette tables are generated color values derived from game data. English dye names are extracted from the public `xivapi/ffxiv-datamining` Stain sheet at commit `ab3b961d58988b493283eb9fd28cb930ea07b169`; the source URL/hash and normalization are recorded in dye metadata and the data-provenance guide. No raw `human.cmp` file or full Stain CSV is distributed. Neither the project's MIT license nor the upstream MIT code notice grants rights to game-derived data, artwork, names or trademarks. Release/data-notice review remains a maintainer gate. Attribution does not itself grant permission. See the official [FINAL FANTASY XIV Materials Usage Policy](https://support.na.square-enix.com/rule.php?id=5382&policy=update&tag=authc) for Square Enix's stated terms; this notice does not claim those terms authorize every dataset or use in this project.

## Color-difference formula

The CIEDE2000 implementation uses the published formula described by G. Sharma, W. Wu, and E. N. Dalal, *The CIEDE2000 Color-Difference Formula: Implementation Notes, Supplementary Test Data, and Mathematical Observations*, Color Research and Application 30(1), 21–30 (2005). The authors' reference page is https://hajim.rochester.edu/ece/sites/gsharma/ciede2000/. Their MATLAB implementation is not copied.
