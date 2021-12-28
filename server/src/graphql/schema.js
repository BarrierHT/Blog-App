const { buildSchema } = require('graphql');

const schema = buildSchema(`                                    #Build schema with resolvers in RootValues
    
    type Post { #model
        _id: ID!
        title: String!
        content: String!
        imageUrl: String!
        createdAt: String!
        updatedAt: String!
        creator: User!
    }

    type User { #model
        _id: ID!
        name: String!
        email: String!
        password: String
        status: String!
        posts: [Post!]!
    }

    type AuthData { #login
        token: String!
        userId: String!
    }

    type getPostsData { #getPosts
        posts: [Post!]!
        totalItems: Int!
    }

    input UserInputData { #signup
        email: String!
        name: String!
        password: String!
    }

    type RootQuery {
        hello: String!
        login(email: String!, password: String!): AuthData!
        getPosts(page: Int): getPostsData!
        getPost(postId: ID!): Post!
        getUser: User!
    }

    type RootMutation {
        signup(userInput: UserInputData): User!
        createPost(title: String!, content: String!, imageUrl: String!): Post!
        editPost(
            title: String!
            content: String!
            imageUrl: String!
            postId: ID!
        ): Post!
        deletePost(postId: ID!): Boolean!
        updateStatus(status: String!): Boolean!
    }

    type RootSubscription {
        helloSocket: String
    }

    schema {
        #*all schemas (queries, mutations, subscriptions)
        query: RootQuery
        mutation: RootMutation
        subscription: RootSubscription
    }




`);

// const schema = new GraphQLSchema({
//     query: new GraphQLObjectType({
//         name: 'RootQuery',
//         fields: {
//             hello: GraphQLString,
//         },
//     }),
// });

module.exports = schema;
