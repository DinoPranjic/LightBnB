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
          properties.*,
          reservations.*,
          avg(property_reviews.rating) AS average_rating
      FROM properties
      JOIN reservations ON properties.id = reservations.property_id
      JOIN property_reviews ON properties.id = property_reviews.property_id
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
        JOIN property_reviews ON property_reviews.property_id = properties.id
        `;

    if (options.city) {
      queryParams.push(`%${options.city}%`);
      queryString += `WHERE city LIKE $${queryParams.length} `;
    }

    if (options.owner_id) {
      queryParams.push(`${options.owner_id}`);
      if (queryParams.length === 1) {
      queryString += `WHERE owner_id = $${queryParams.length} `;
      } else {
        queryString += `AND owner_id = $${queryParams.length} `;
      }
    }

    if (options.minimum_price_per_night) {
      let min = options.minimum_price_per_night * 100;

      queryParams.push(`${min}`);
      if (queryParams.length === 1) {
      queryString += `WHERE cost_per_night >= $${queryParams.length} `;
      } else {
        queryString += `AND cost_per_night >= $${queryParams.length} `;
      }
    }

    if (options.maximum_price_per_night) {
      let max = options.maximum_price_per_night * 100;

      queryParams.push(`${max}`);
      if (queryParams.length === 1) {
        queryString += `WHERE cost_per_night <= $${queryParams.length} `;
      } else {
        queryString += `AND cost_per_night <= $${queryParams.length} `;
      }
    }

    queryString += `GROUP BY properties.id`;

    if (options.minimum_rating) {
      queryParams.push(`${options.minimum_rating}`);
      queryString += `
      HAVING avg(rating) >= $${queryParams.length} `;
    }

    queryParams.push(limit);
    queryString += `
        ORDER BY cost_per_night
        LIMIT $${queryParams.length};`;


    return pool.query(queryString, queryParams).then((res) => res.rows).catch(err => {console.log(err)});
};
exports.getAllProperties = getAllProperties;

// add a property
const addProperty = function(property) {
  queryString = `
  INSERT INTO properties
    (owner_id, title, description, thumbnail_photo_url, cover_photo_url, cost_per_night, street, city, province, post_code, country, parking_spaces, number_of_bathrooms, number_of_bedrooms)
  VALUES
    ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
  RETURNING *;`;

  const properties = [property.owner_id, property.title, property.description, property.thumbnail_photo_url, property.cover_photo_url, property.cost_per_night, property.street, property.city, property.province, property.post_code, property.country, property.parking_spaces, property.number_of_bathrooms, property.number_of_bedrooms];

  return pool.query(queryString, properties).then(res => res.rows[0]);
}

exports.addProperty = addProperty;
