// Copyright (C) 2023 Light, Inc.
//
// This program is free software: you can redistribute it and/or modify
// it under the terms of the GNU Affero General Public License as published by
// the Free Software Foundation, either version 3 of the License, or
// (at your option) any later version.
//
// This program is distributed in the hope that it will be useful,
// but WITHOUT ANY WARRANTY; without even the implied warranty of
// MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
// GNU Affero General Public License for more details.
//
// You should have received a copy of the GNU Affero General Public License
// along with this program.  If not, see <http://www.gnu.org/licenses/>.

// SPDX-License-Identifier: AGPL-3.0-or-later

pragma solidity ^0.8.18;

// LightDeployer - Create abstract contract of just immutable storages
abstract contract LightDeployer {
    // -------------------------------------------------------------------------
    // Immutable Storage
    // -------------------------------------------------------------------------

    address internal constant LIGHT_FACTORY_ADDRESS = address(0x63CBfA247a2c1043892c7cEB4C21d1d8BC71Ffab);

    // -------------------------------------------------------------------------
    // Utilities
    // -------------------------------------------------------------------------

    function randMod() internal view returns (uint256) {
        return uint256(keccak256(abi.encodePacked(block.timestamp, block.prevrandao))) % 4337;
    }
}
