/********************************************************************************
 * Copyright (c) 2024 EclipseSource and others.
 *
 * This program and the accompanying materials are made available under the
 * terms of the Eclipse Public License v. 2.0 which is available at
 * http://www.eclipse.org/legal/epl-2.0.
 *
 * This Source Code may also be made available under the following Secondary
 * Licenses when the conditions for such availability set forth in the Eclipse
 * Public License v. 2.0 are satisfied: GNU General Public License, version 2
 * with the GNU Classpath Exception which is available at
 * https://www.gnu.org/software/classpath/license.html.
 *
 * SPDX-License-Identifier: EPL-2.0 OR GPL-2.0 WITH Classpath-exception-2.0
 ********************************************************************************/
/* eslint-disable @typescript-eslint/no-shadow */

import { Dimension, Point } from 'sprotty-protocol/lib/utils/geometry';

declare module 'sprotty-protocol/lib/utils/geometry' {
    namespace Dimension {
        /**
         * Applies the given function to the `width` and `height` of the given dimensional object to create a new dimensional object.
         *
         * @param dimension source dimension
         * @param callbackfn function applied to `width` and `height` to create a new dimension
         * @returns new dimension
         */
        function map<T extends Dimension>(dimension: T, callbackfn: (value: number, key: keyof Dimension) => number): T;
        /**
         * Returns the center point of the given dimension.
         *
         * @param dimension dimension
         * @returns center point
         */
        function center(dimension: Dimension): Point;

        /**
         * Computes the sum of two dimensions. The result has the sum of the `width` and `height` of the two dimensions.
         * @param dimension the first dimension
         * @param add the second dimension
         * @returns the sum of the two dimensions
         */
        function add(dimension: Dimension, add: Dimension): Dimension;

        /**
         * Computes the difference of two dimensions. The result has the difference of the `width` and `height` of the two dimensions.
         * @param dimension the first dimension
         * @param subtract the second dimension
         * @returns the difference of the two dimensions
         */
        function subtract(dimension: Dimension, subtract: Dimension): Dimension;

        /**
         * Computes the product of a dimension and a measure.
         * The result has the `width` and `height` of the dimension multiplied by the measure.
         * @param dimension the dimension
         * @param measure the measure
         * @returns the product of the dimension and the measure
         */
        function multiplyMeasure(dimension: Dimension, measure: number): Dimension;

        /**
         * Computes the quotient of a dimension and a measure.
         * @param dimension the dimension
         * @param measure the measure
         * @returns the quotient of the dimension and the measure
         */
        function divideMeasure(dimension: Dimension, measure: number): Dimension;

        /**
         * Checks if two dimensions are equal. Two dimensions are equal if their `width` and `height` are equal.
         * @param left the left dimension
         * @param right the right dimension
         * @returns true if the dimensions are equal, false otherwise
         */
        function equals(left: Dimension, right: Dimension): boolean;
    }
}

Dimension.center = (d: Dimension): Point => ({ x: d.width * 0.5, y: d.height * 0.5 });
Dimension.add = (d: Dimension, a: Dimension): Dimension => ({ width: d.width + a.width, height: d.height + a.height });
Dimension.subtract = (d: Dimension, a: Dimension): Dimension => ({ width: d.width - a.width, height: d.height - a.height });
Dimension.multiplyMeasure = (d: Dimension, m: number): Dimension => ({ width: d.width * m, height: d.height * m });
Dimension.divideMeasure = (d: Dimension, m: number): Dimension => ({ width: d.width / m, height: d.height / m });

Dimension.map = <T extends Dimension>(dimension: T, callbackfn: (value: number, key: keyof Dimension) => number): T => ({
    ...dimension,
    width: callbackfn(dimension.width, 'width'),
    height: callbackfn(dimension.height, 'height')
});
Dimension.equals = (left: Dimension, right: Dimension): boolean => left.width === right.width && left.height === right.height;

export { Dimension };
