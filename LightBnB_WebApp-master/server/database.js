const properties = require('./json/properties.json');
const users = require('./json/users.json');
const { Pool } = require('pg');

const pool = new Pool({
  user: 'vagrant',
  password: '123',
  host: 'localhost',
  database: 'lightbnb'
});


/// Users

const getUserWithEmail = function(email) {
  const queryString = `
    SELECT *
    FROM users
    WHERE email = $1;`;
return pool
    .query(queryString, [email.toLowerCase()]) // makes sure all emails are lowercase
    .then(result => result.rows[0]) // returns just one user
};

exports.getUserWithEmail = getUserWithEmail;


const getUserWithId = function(id) {
  const queryString = `
      SELECT * FROM users
      WHERE id = $1;`;
  
  return pool.query(queryString, [id]).then(res => res.rows[0]);
};
exports.getUserWithId = getUserWithId;


const addUser =  function(user) {
  const queryString = `
      INSERT INTO users
        (name, password, email)
      VALUES
        ($1, $2, $3)
      RETURNING *;`;
  return pool.query(queryString, [user.name, user.password, user.email.toLowerCase()]).then(res => res.rows[0]);
}
exports.addUser = addUser;

/// Reservations

/**
 * Get all reservations for a single user.
 * @param {string} guest_id The id of the user.
 * @return {Promise<[{}]>} A promise to the reservations.
 */
const getAllReservations = function(guest_id, limit = 10) {
  return getAllProperties(null, 2);
}
exports.getAllReservations = getAllReservations;

/// Properties

/**
 * Get all properties.
 * @param {{}} options An object containing query options.
 * @param {*} limit The number of results to return.
 * @return {Promise<[{}]>}  A promise to the properties.
 */
 const getAllProperties = (options, limit = 10) => {
  return pool
    .query(`SELECT * FROM properties LIMIT $1;`, [limit])
    .then((result) => {
      console.log(result.rows);
      return result.rows;
    })
    .catch((err) => {
      console.log(err.message);
    });
};
exports.getAllProperties = getAllProperties;


/**
 * Add a property to the database
 * @param {{}} property An object containing all of the property details.
 * @return {Promise<{}>} A promise to the property.
 */
const addProperty = function(property) {
  const propertyId = Object.keys(properties).length + 1;
  property.id = propertyId;
  properties[propertyId] = property;
  return Promise.resolve(property);
}
exports.addProperty = addProperty;
