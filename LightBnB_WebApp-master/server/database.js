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


const getAllReservations = function(guest_id, limit = 10) {
  const queryString = `
      SELECT
          properties.*
          reservations.*
          avg(property_reviews.rating) AS average_rating
      FROM property_reviews
      JOIN reservations ON properties.id = property_reviews.property_id
      JOIN properties ON properties.id = reservations.property_id
      WHERE
          reservations.guest_id = $1 AND
          reservations.end_date < now()::date
      GROUP BY reservations.id, properties.id
      ORDER BY reservations.start_date
      LIMIT $2;`;

    return pool.query(queryString, [guest_id, limit]).then(res => res.rows);
}
exports.getAllReservations = getAllReservations;

/// Properties
 const getAllProperties = (options, limit = 10) => {
   const queryParams = [];
   let queryString = `
        SELECT properties.*, avg(property_reviews.rating) as average_rating
        FROM properties
        JOIN property_reviews ON property.id = property.id`;

    if (options.city) {
      queryParams.push(`%${options.city}`);
      queryString += `WHERE city LIKE $${queryParams.length} `;
    }

    if (options.owner_id) {
      queryParams.push(`${options.owner_id}`);
      queryString += `AND owner_id = $${queryParams.length} `;
    }

    if (options.minimum_price_per_night && options.maximum_price_per_night) {
      let min = options.minimum_price_per_night * 100;
      let max = options.maximum_price_per_night * 100; 

      queryParams.push(`${min}`);
      queryString += `AND cost_per_night >= $${queryParams.length} `;

      queryParams.push(`${max}`);
      queryString += `AND cost_per_night <= $${queryParams.length} `;
    }

    if (options.minimum_rating) {
      queryParams.push(`${options.minimum_rating}`);
      queryString += `HAVING average_rating >= $${queryParams.length}`;
    }

    queryParams.push(limit);
    queryString += `
        GROUP BY properties.id
        ORDER BY cost_per_night
        LIMIT $${queryParams.length};`;


    return pool.query(queryString, queryParams).then((res) => res.rows);
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
