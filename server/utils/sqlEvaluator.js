const alasql = require('alasql');

/**
 * Safely evaluates student SQL query against expected query using an in-memory database instance.
 * @param {string} studentQuery - SQL query written by student
 * @param {string} schemaSql - DDL and INSERT statements for test schema setup
 * @param {string} expectedQuery - Gold standard reference query
 * @returns {object} { pass: boolean, studentResult: array|null, expectedResult: array|null, error: string|null }
 */
const evaluateSqlQuery = (studentQuery, schemaSql, expectedQuery) => {
  if (!studentQuery || !studentQuery.trim()) {
    return { pass: false, error: 'Empty query submitted' };
  }

  // Restrict destructive keywords to prevent abusive operations
  const forbiddenKeywords = ['DROP DATABASE', 'SHUTDOWN', 'SYSTEM', 'PROCESS'];
  const upperQuery = studentQuery.toUpperCase();
  for (const kw of forbiddenKeywords) {
    if (upperQuery.includes(kw)) {
      return { pass: false, error: `Forbidden operation detected: ${kw}` };
    }
  }

  const dbName = 'testdb_' + Math.random().toString(36).substr(2, 9);

  try {
    alasql(`CREATE DATABASE ${dbName}; USE ${dbName};`);

    // Setup schema and seed data
    if (schemaSql) {
      const statements = schemaSql.split(';').map(s => s.trim()).filter(Boolean);
      for (const stmt of statements) {
        alasql(stmt);
      }
    }

    // Execute reference query
    const expectedResult = alasql(expectedQuery);

    // Execute student query
    const studentResult = alasql(studentQuery);

    // Compare results
    const pass = compareResults(studentResult, expectedResult);

    // Cleanup
    alasql(`DROP DATABASE ${dbName};`);

    return {
      pass,
      studentResult,
      expectedResult,
      error: pass ? null : 'Query output does not match expected result'
    };
  } catch (err) {
    try { alasql(`DROP DATABASE ${dbName};`); } catch (e) {}
    return {
      pass: false,
      studentResult: null,
      expectedResult: null,
      error: `SQL Execution Error: ${err.message}`
    };
  }
};

const compareResults = (res1, res2) => {
  if (!res1 || !res2) return false;
  if (!Array.isArray(res1) || !Array.isArray(res2)) return false;
  if (res1.length !== res2.length) return false;

  try {
    const stringifyClean = (arr) => JSON.stringify(arr.map(row => {
      const sortedObj = {};
      Object.keys(row || {}).sort().forEach(k => {
        sortedObj[k] = row[k];
      });
      return sortedObj;
    }));

    return stringifyClean(res1) === stringifyClean(res2);
  } catch (e) {
    return false;
  }
};

module.exports = { evaluateSqlQuery };
