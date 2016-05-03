function Map(values) {
    const m = {};

    values.forEach((element) => {
        m[element[0]] = element[1];
    });

    return m;
}

class Column {
    constructor(position, name, func = null, aggregation = false) {
        this.position = position;
        this.name = name;
        this.func = typeof func !== 'function' ? (element) => element : func;
        this.aggregation = aggregation;
    }

    /**
     *
     * @param name
     * @returns {Column}
     */
    rename(name) {
        return new Column(this.position, name, this.func, this.aggregation);
    }

    /**
     * builtin aggregation function
     *
     * @returns {Column}
     */
    sum() {
        const func = (values) => values.reduce((prev, current) => prev + current);
        return new Column(this.position, `sum(${this.name})`, func, true);
    }

    /**
     * builtin aggregation function
     *
     * @returns {Column}
     */
    max() {
        const func = (values) => values.reduce((prev, current) => prev > current ? prev : current);
        return new Column(this.position, `max(${this.name})`, func, true);
    }

    /**
     * builtin aggregation function
     *
     * @returns {Column}
     */
    min() {
        const func = (values) => values.reduce((prev, current) => prev < current ? prev : current);
        return new Column(this.position, `min(${this.name})`, func, true);
    }

    /**
     * builtin aggregation function
     *
     * @returns {Column}
     */
    avg() {
        const func = (values) => {
            const total = values.reduce((prev, current) => prev + current);
            const count = typeof values.count === 'function' ? values.count() : values.length;
            return total / count;
        };
        return new Column(this.position, `avg(${this.name})`, func, true);
    }

    /**
     * builtin aggregation function
     *
     * @returns {Column}
     */
    count() {
        const func = (values) => typeof values.count === 'function' ? values.count() : values.length;
        return new Column(this.position, `count(${this.name})`, func, true);
    }

    /**
     * custom function
     *
     * @param {String} name function name
     * @param {Function} func function
     * @param {Boolean} aggregation
     * @returns {Column}
     */
    transform(name, func, aggregation = false) {
        return new Column(this.position, `${name}(${this.name})`, func, aggregation);
    }

    /**
     * @param {Array<Array>} rows
     */
    reduce(rows) {
        return this.func(rows.map((element) => element[this.position]));
    }

    /**
     * @param {Array} row
     */
    map(row) {
        return this.func(row[this.position]);
    }
}

class DataFrame {
    constructor(data) {
        // this._initialize(data);
        this.meta = data && data.meta;
        this.rows = data && data.rows;
        this._initializeMappings();
    }

    static fromArray(rows, keyPositions, valuePositions, headerless = true) {
        if (typeof rows !== 'object' || rows.length == 0) {
            throw new Error();
        }

        if (typeof keyPositions !== 'object' || typeof valuePositions != 'object') {
            throw new Error();
        }

        const meta = {};
        const first = rows[0];

        if (headerless) {
            meta.keys = keyPositions.map((index) => '_c' + index);
            meta.columns = valuePositions.map((index) => '_c' + index);
        } else {
            rows.shift();
            meta.keys = keyPositions.map((index) => first[index]);
            meta.columns = valuePositions.map((index) => first[index]);
        }

        return new DataFrame({
            meta: meta,
            rows: rows.map((row) => [
                keyPositions.map((index) => row[index]),
                valuePositions.map((index) => row[index])
            ])
        });
    }

    _initializeMappings() {
        this._mappings = {
            keys: Map(this.meta.keys.map((element, index) => [element, index])),
            columns: Map(this.meta.columns.map((element, index) => [element, index]))
        };
    }

    key(name) {
        const pos = this._lookupPosition('keys', name);
        return this.rows.map(row => row[0][pos]);
    }

    col(name) {
        const pos = this._lookupPosition('columns', name);
        return this.rows.map(row => row[1][pos]);
    }

    /**
     *
     * @param {Array<String>} names
     * @return {DataFrame}
     */
    select(...names) {
        const data = this._cloneMeta(null, this._lookupPositions('columns', names));
        const columns = names.map((name, index) => this.c(name));
        const rows = this.rows.map(this._map(this._columns(columns)));
        
        data.rows = rows;

        return new DataFrame(data);
    }

    c(name) {
        const mappings = this._mappings.columns;
        const position = typeof name === 'number' && name < mappings.length ? name : mappings[name];

        return new Column(position, this.meta.columns[position]);
    }

    sort(desc = false) {
        return new DataFrame(this._cloneMeta()
            .set('rows', this.rows.sort((a, b) => !desc ? a[0] > b[0] : a[0] < b[0])));
    }

    collect(fn) {
        return this.rows.map((element) => {
            return fn(element[0], element[1]);
        });
    }

    /**
     *
     * @param {DataFrame} frame
     * @return {DataFrame}
     */
    merge(frame) {
        const data = this._mergeMeta(frame);
        const columnCounts = [
            this.meta.get('columns').count(),
            frame.meta.get('columns').count()
        ];
        const emptyColumns = columnCounts.map((element) => new Array(element));
        const keys2 = Map(frame.rows.map((element, index) => [element[0].toString(), index]));

        const includes = this.rows.reduce((acc, curr) => {
            return acc.set(curr[0].toString(), typeof keys2.get(curr[0].toString()) === 'number');
        }, {});

        const rows = this.rows.map((element) => {
            const key = element[0];
            const has = typeof keys2.get(key.toString()) === 'number';
            return [key, element[1].concat(has ? frame.rows.get(keys2.get(key.toString()))[1] : emptyColumns[1])];
        });

        const additional = frame.rows.reduce((acc, element) => {
            const key = element[0];
            return includes.get(key.toString()) ? acc : acc.push([key, emptyColumns[0].concat(element[1])]);
        }, []);

        return new DataFrame(data.set('rows', rows.concat(additional)));
    }

    /**
     * @param {Array} keys
     * @param {Array<Column>} columns
     * @return {DataFrame}
     */
    groupByKey(keys, ...columns) {
        const data = this._cloneMeta(keys);
        const groups = [];
        const rowIndexes = {};

        this.rows.forEach((element) => {
            const rowKey = keys == null ? 0 : this._lookupCells(element[0], keys);
            if (typeof rowIndexes[rowKey] !== 'number') {
                rowIndexes[rowKey] = groups.push([rowKey, []]) - 1;
            }
            groups[rowIndexes[rowKey]][1].push(element[1]);
        });

        data.meta.columns = columns.map((element) => element.name);
        data.rows = groups.map(this._reduce(this._columns(columns)))

        return new DataFrame(data);
    }

    _reduce(columns = null) {
        return (element) => {
            return [element[0], columns.map((col) => col.reduce(element[1]))];
        };
    }

    _map(columns = null) {
        return (element) => {
            return [element[0], columns.map((col) => col.map(element[1]))];
        };
    }

    /**
     * @param columns
     * @returns {Array<Column>}
     * @private
     */
    _columns(columns) {
        return columns.filter((column) => column && column.name);
    }

    _cloneMeta(keys = null, columns = null) {
        const meta = {
            keys: this._lookupCells(this.meta.keys, keys),
            columns: this._lookupCells(this.meta.columns, columns)
        };

        return {
            meta
        };
    }

    /**
     *
     * @param {DataFrame} frame
     * @return {DataFrame}
     * @private
     */
    _mergeMeta(frame) {
        const meta = {
            keys: this._lookupCells(this.meta.get('keys'), null),
            columns: this.meta.get('columns').map((element) => `$1.${element}`)
                .concat(frame.meta.get('columns').map((element) => `$2.${element}`))
        };

        return {
            meta
        };
    }

    _picks(collection, ids) {
        return collection.filter((element, index) => {
            return ids.indexOf(index);
        });
    }

    /**
     *
     * @param {Array<String>} cells
     * @param {Array<Number>} indexes
     * @returns {Array<String>}
     * @private
     */
    _lookupCells(cells, indexes) {
        if (indexes == null) {
            return cells;
        }

        return indexes.map((element) => cells[element]);
    }

    /**
     *
     * @param {String} mapping
     * @param {Array<String>|Array<Number>} names
     * @returns {Array<Number>}
     * @private
     */
    _lookupPositions(mapping, names) {
        const mappings = this._mappings[mapping];

        return names.map((name) => {
            if (typeof name === 'number' && name < mappings.length) {
                return name;
            }

            if (typeof mappings[name] !== 'undefined') {
                return mappings[name];
            }

            throw new Error('not_found');
        });
    }

    _lookupPosition(mapping, name) {
        const mappings = this._mappings[mapping];
        if (typeof name === 'number' && name < mappings.length) {
            return name;
        }

        return mappings[name];
    }
}

module.exports = DataFrame;