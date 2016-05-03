var assert = require('chai').assert;
var DataFrame = require('../build/rdf');

describe('DataFrame', function () {
    describe('::fromArray', function () {
        it('headless:false', function () {
            const df = DataFrame.fromArray([
                ['c0', 'c1', 'c2', 'c3', 'c4'],
                [20160427,1,79176,16113,3140],
                [20160428,2,3315065,165474,29391],
                [20160429,3,3218848,198481,30458]
            ], [0], [1,2,3,4], false);

            assert.equal(3, df.rows.length);
            assert.equal(1, df.meta.keys.length);

            assert.deepEqual([[20160427],[1,79176,16113,3140]], df.rows[0]);
        });

        it('headless:true', function() {
            const df = DataFrame.fromArray([
                [20160427,1,79176,16113,3140],
                [20160428,2,3315065,165474,29391],
                [20160429,3,3218848,198481,30458]
            ], [0], [1,2,3,4], true);

            assert.equal(3, df.rows.length);
            assert.equal(1, df.meta.keys.length);

            assert.deepEqual([[20160427],[1,79176,16113,3140]], df.rows[0]);
        });

        it('headless:false and lookup', function() {
            const df = DataFrame.fromArray([
                ['c0','c1','c2','c3','c4'],
                [20160427,1,79176,16113,3140]
            ], [0], [1,2,3,4], false);

            // no error
            df.select('c1', 'c2');

            try {
                df.select('_c1');
                assert.fail('unexpect');
            } catch (e) {
            }
        });

        it('headless:true and lookup', function() {
            const df = DataFrame.fromArray([
                [20160427,1,79176,16113,3140]
            ], [0], [1,2,3,4], true);

            // no error
            df.select('_c1', '_c2');

            try {
                df.select('c0');
                assert.fail('unexpect');
            } catch (e) {
            }
        });

        it('headless:false and groupByKey', function() {
            const df = DataFrame.fromArray([
                ['ymd','a','b','c','d'],
                [20160427,1,79176,16113,3140],
                [20160428,2,3315065,165474,29391],
                [20160429,3,3218848,198481,30458],
                [20160430,2,3725668,156129,31158],
                [20160501,1,4129722,145934,40201]
            ], [1], [2,3,4], false);
            
            const df2 = df
                .select('b', 'c', 'd')
                .groupByKey(
                    [0],
                    df.c('b').sum().rename('total_b')
                );

            assert.deepEqual([4208898,7040733,3218848], df2.col('total_b'));
        });
    });
});
