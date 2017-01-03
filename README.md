node-rdf
========

# Install

```js
npm install --save node-rdf
```

# Examples

## fromArray

```js
var DF = require('node-rdf');
var sales = [
  [20170101, 'ko', 5, 5000], [20170102, 'ko', 3, 6000], [20170103, 'ko', 7, 7000],
  [20170101, 'ja', 2, 1000], [20170102, 'ja', 1, 2000], [20170103, 'ja', 2, 3000],
  [20170101, 'en', 1,  500], [20170102, 'en', 1, 2500], [20170103, 'en', 1, 3500]
];
var pdf1 = DF.fromArray(sales, [0, 1], [2, 3], true);
var pdf2 = pdf1.renames(['ymd', 'lang', 'cnt', 'sale']); // clone & rename

> pdf1.meta
{ keys: [ '_c0', '_c1' ], columns: [ '_c2', '_c3' ] }

> pdf2.meta
{ keys: [ 'ymd', 'lang' ], columns: [ 'cnt', 'sale' ] }
```

OR

```js
var sales = [
  ['ymd', 'lang', 'cnt', 'sale'],
  [20170101, 'ko', 5, 5000], [20170102, 'ko', 3, 6000], [20170103, 'ko', 7, 7000],
  [20170101, 'ja', 2, 1000], [20170102, 'ja', 1, 2000], [20170103, 'ja', 2, 3000],
  [20170101, 'en', 1,  500], [20170102, 'en', 1, 2500], [20170103, 'en', 1, 3500]
];
var pdf = DF.fromArray(sales, [0, 1], [2, 3], false);

> pdf.meta
{ keys: [ 'ymd', 'lang' ], columns: [ 'cnt', 'sale' ] }

> pdf.rows
[ [ [ 20170101, 'ko' ], [ 5, 5000 ] ],
  [ [ 20170102, 'ko' ], [ 3, 6000 ] ],
  [ [ 20170103, 'ko' ], [ 7, 7000 ] ],
  [ [ 20170101, 'ja' ], [ 2, 1000 ] ],
  [ [ 20170102, 'ja' ], [ 1, 2000 ] ],
  [ [ 20170103, 'ja' ], [ 2, 3000 ] ],
  [ [ 20170101, 'en' ], [ 1, 500 ] ],
  [ [ 20170102, 'en' ], [ 1, 2500 ] ],
  [ [ 20170103, 'en' ], [ 1, 3500 ] ] ]
```

## groupByKey

built-in aggregation functions : sum, cnt, avg, min, max, concat, 

```js
var gpdf1 = pdf.groupByKey([1], pdf.c('cnt').sum()); // OR pdf.groupByKey([1], pdf.c('cnt').sum().rename('cnt'))

> gpdf1.meta
{ keys: [ 'lang' ], columns: [ 'sum(cnt)' ] }

> gpdf1.rows
[ [ [ 'ko' ], [ 15 ] ],
  [ [ 'ja' ], [ 5 ] ],
  [ [ 'en' ], [ 3 ] ] ]


var gpdf2 = pdf.groupByKey([0], pdf.c('cnt').max(), pdf.c('sale').sum());

> gpdf2.meta
{ keys: [ 'ymd' ], columns: [ 'max(cnt)', 'sum(sale)' ] }

> gpdf2.rows
[ [ [ 20170101 ], [ 5, 6500 ] ],
  [ [ 20170102 ], [ 3, 10500 ] ],
  [ [ 20170103 ], [ 7, 13500 ] ] ]

var gpdf3 = pdf.groupByKey([0], pdf.c('cnt').avg().rename('avg_cnt'), pdf.c('sale').avg().rename('avg_sale'));

> gpdf3.rows
[ [ [ 20170101 ], [ 2.6666666666666665, 2166.6666666666665 ] ],
  [ [ 20170102 ], [ 1.6666666666666667, 3500 ] ],
  [ [ 20170103 ], [ 3.3333333333333335, 4500 ] ] ]

> gpdf3.col('avg_cnt')
[ 2.6666666666666665, 1.6666666666666667, 3.3333333333333335 ]

> gpdf3.col('avg_sale')
[ 2166.6666666666665, 3500, 4500 ]

// custom aggregation function 
var gpdf4 = pdf.groupByKey([0], pdf.c('cnt').transform('custom', (values) => values.reduce((prev, current) => prev + current), true)); // pdf.groupByKey([0], pdf.c('cnt').sum())

> gpdf4.meta
{ keys: [ 'ymd' ], columns: [ 'custom(cnt)' ] }

> gpdf4.rows
[ [ [ 20170101 ], [ 8 ] ],
  [ [ 20170102 ], [ 5 ] ],
  [ [ 20170103 ], [ 10 ] ] ]
```


## Merge (join?)


```js
var pdf2 = pdf.merge(pdf);

> pdf2.meta
{ keys: [ 'ymd', 'lang' ],
  columns: [ '$1.cnt', '$1.sale', '$2.cnt', '$2.sale' ] }

> pdf2.rows
[ [ [ 20170101, 'ko' ], [ 5, 5000, 5, 5000 ] ],
  [ [ 20170102, 'ko' ], [ 3, 6000, 3, 6000 ] ],
  [ [ 20170103, 'ko' ], [ 7, 7000, 7, 7000 ] ],
  [ [ 20170101, 'ja' ], [ 2, 1000, 2, 1000 ] ],
  [ [ 20170102, 'ja' ], [ 1, 2000, 1, 2000 ] ],
  [ [ 20170103, 'ja' ], [ 2, 3000, 2, 3000 ] ],
  [ [ 20170101, 'en' ], [ 1, 500, 1, 500 ] ],
  [ [ 20170102, 'en' ], [ 1, 2500, 1, 2500 ] ],
  [ [ 20170103, 'en' ], [ 1, 3500, 1, 3500 ] ] ]
```

## Filter



...



...
