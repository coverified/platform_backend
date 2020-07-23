const gql = require('graphql-tag');

module.exports = async keystone => {
    // Create a context which can execute GraphQL operations with no access control
    const context = keystone.createContext({skipAccessControl: true});

    // Setup postgres extensions
    await keystone.adapters[keystone.defaultAdapter].knex.raw('CREATE EXTENSION IF NOT EXISTS pgcrypto').then(() => {
        console.log('Postgres extension pgcrypto installed');
    });

    // Count existing users
    const {
        data: {
            _allUsersMeta: {count},
        },
    } = await keystone.executeGraphQL({
        context,
        query: gql`query {
            _allUsersMeta {
                count
            }
        }`,
    });

    if (count === 0) {
        const password = 'test1234';
        const email = 'admin@example.com';

        console.log(await keystone.executeGraphQL({
                context,
                query: gql`mutation initialUser($password: String, $email: String) {
                    createUser(data: {name: "Admin", email: $email, isAdmin: true, password: $password}) {
                        id
                    }
                }`,
                variables: {
                    password,
                    email,
                },
            }
        ));

        console.log(`

User created:
  email: ${email}
  password: ${password}
Please change these details after initial login.
`);
    }
};
