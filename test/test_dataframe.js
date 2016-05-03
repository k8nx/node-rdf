var assert = require('chai').assert;
var DataFrame = require('../build/rdf');

describe('DataFrame', function () {
    describe('::fromArray', function () {
        it('headless:false', function () {
            const df = DataFrame.fromArray([
                ['ymd', 'uv_all', 'c2', 'c3', 'c4'],
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

        it('headless:true and groupByKey', function() {
            const df = DataFrame.fromArray([
  [20160427,137934,275792,123875,219946,2505,23099,1298,7628],
  [20160428,153271,295842,149708,264923,2515,23967,1328,6929],
  [20160429,139475,280422,135542,246245,3070,27829,1283,6826],
  [20160430,146398,290587,141782,261857,3769,22649,1292,6787],
  [20160501,161399,315228,157218,284906,3189,21183,1493,9932],
  [20160502,138080,274148,134228,246616,2609,18600,1761,9897]
            ], [0], [1,2], true);

            const uvm = df.select('_c1', '_c2');
            console.log(uvm.rows);
            console.log(uvm.col('_c1'));
            
            const df2 = df
                .select('_c1')
                .groupByKey(
                    [0],
                    df.c('_c1').sum().rename('uv')
                );

            // assert.deepEqual([4208898,7040733,3218848], df2.col('total_b'));
        });
    });
});
