import { graphql, buildSchema } from 'graphql';
import { FastifyPluginAsyncJsonSchemaToTs } from '@fastify/type-provider-json-schema-to-ts';
import { graphqlBodySchema } from './schema';
import { resolvers } from './resolvers';

const schema = buildSchema(`
  type Query {
    getUsers: [User]
    getUser(id: String!): User
    getUsersWithInfo: [UserWithInfo]
    getUserWithInfo(id: String!): UserWithInfo
    
    getProfiles: [Profile]
    getProfile(id: String!): User
    
    getPosts: [Post]
    getPost(id: String!): User
    
    getMemberTypes: [MemberType]
    getMemberType(id: String!): User
  }
  
  type User {
    id: String!
    firstName: String!
    lastName: String!
    email: String!
    subscribedToUserIds: [String]!
  }
  
  type UserWithInfo {
    id: String!
    firstName: String!
    lastName: String!
    email: String!
    subscribedToUserIds: [String]!
    posts: [Post]
    profile: Profile
    memberType: MemberType
  }
  
  type Profile {
    id: String!
    avatar: String
    sex: String
    birthday: Int
    country: String
    street: String
    city: String
    memberTypeId: String
    userId: String
  }
  
  type Post {
    id: String!
    title: String
    content: String
    userId: String
  }
  
  type MemberType {
    id: String!
    discount: Int
    monthPostsLimit: Int
  }
`);

const plugin: FastifyPluginAsyncJsonSchemaToTs = async (
  fastify
): Promise<void> => {
  fastify.post(
    '/',
    {
      schema: {
        body: graphqlBodySchema,
      },
    },
    async function (request, reply) {
      return await graphql({
        schema,
        rootValue     : resolvers,
        source        : String(request.body.query),
        variableValues: request.body.variables,
        contextValue  : fastify,
      });
    }
  );
};

export default plugin;
