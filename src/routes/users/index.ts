import * as lodash from 'lodash';
import { FastifyPluginAsyncJsonSchemaToTs } from '@fastify/type-provider-json-schema-to-ts';
import { idParamSchema } from '../../utils/reusedSchemas';
import { validateId } from '../../utils/userIdValidator';
import type { UserEntity } from '../../utils/DB/entities/DBUsers';
import {
  createUserBodySchema,
  changeUserBodySchema,
  subscribeBodySchema,
} from './schemas';

const plugin: FastifyPluginAsyncJsonSchemaToTs = async (
  fastify
): Promise<void> => {
  fastify.get('/', async function (request, reply): Promise<UserEntity[]> {
    return this.db.users.findMany();
  });

  fastify.get(
    '/:id',
    {
      schema: {
        params: idParamSchema,
      },
    },
    async function (request, reply): Promise<UserEntity> {
      const { id } = request.params as Record<'id', string>;

      const user = await this.db.users.findOne({ key: 'id', equals: id });
      if (!user) {
        throw reply.notFound(`User with id ${id} not found`);
      }

      return user;
    }
  );

  fastify.post(
    '/',
    {
      schema: {
        body: createUserBodySchema,
      },
    },
    async function (request, reply): Promise<UserEntity> {
      return this.db.users.create(request.body as Omit<UserEntity, 'id' | 'subscribedToUserIds'>);
    }
  );

  fastify.delete(
    '/:id',
    {
      schema: {
        params: idParamSchema,
      },
    },
    async function (request, reply): Promise<UserEntity> {
      const { id } = request.params as Record<'id', string>;
      if (!validateId(id)) {
        throw reply.badRequest(`Invalid user id ${id}`);
      }

      try {
        const removedUser     = await this.db.users.delete(id);
        const subscribedUsers = await this.db.users.findMany({ key: 'subscribedToUserIds', inArray: removedUser.id });

        for (let i = 0; i < subscribedUsers.length; i++) {
          const user        = subscribedUsers[i];
          const updatedUser = lodash.cloneDeep(user);

          updatedUser.subscribedToUserIds = updatedUser.subscribedToUserIds.filter(id => id !== removedUser.id);

          await this.db.users.change(updatedUser.id, updatedUser);
        }

        return removedUser;
      } catch (error) {
        throw reply.notFound(`User with id ${id} not found`);
      }
    }
  );

  fastify.post(
    '/:id/subscribeTo',
    {
      schema: {
        body: subscribeBodySchema,
        params: idParamSchema,
      },
    },
    async function (request, reply): Promise<UserEntity> {
      const { userId } = request.body as Record<'userId', string>
      const { id }     = request.params as Record<'id', string>;
      if (!validateId(userId) || !validateId(id)) {
        throw reply.badRequest(`Invalid users id`);
      }

      const user = await this.db.users.findOne({ key: 'id', equals: userId });
      if (!user) {
        throw reply.notFound(`User with id ${id} not found`);
      }

      if (user.subscribedToUserIds.includes(id)) {
        return user;
      }

      const updatedUser = lodash.cloneDeep(user);
      updatedUser.subscribedToUserIds.push(id);

      await this.db.users.change(userId, updatedUser);

      return updatedUser;
    }
  );

  fastify.post(
    '/:id/unsubscribeFrom',
    {
      schema: {
        body: subscribeBodySchema,
        params: idParamSchema,
      },
    },
    async function (request, reply): Promise<UserEntity> {
      const { userId } = request.body as Record<'userId', string>
      const { id }     = request.params as Record<'id', string>;
      if (!validateId(userId) || !validateId(id)) {
        throw reply.badRequest(`Invalid users id`);
      }

      const user = await this.db.users.findOne({ key: 'id', equals: userId });
      if (!user) {
        throw reply.notFound(`User with id ${id} not found`);
      }
      if (!user.subscribedToUserIds.includes(id)) {
        throw reply.badRequest(`Not subscribed`);
      }

      const updatedUser = lodash.cloneDeep(user);
      updatedUser.subscribedToUserIds = updatedUser.subscribedToUserIds.filter(userId => userId !== id);

      await this.db.users.change(userId, updatedUser);

      return updatedUser;
    }
  );

  fastify.patch(
    '/:id',
    {
      schema: {
        body: changeUserBodySchema,
        params: idParamSchema,
      },
    },
    async function (request, reply): Promise<UserEntity> {
      const { id } = request.params as Record<'id', string>;
      if (!validateId(id)) {
        throw reply.badRequest(`Invalid user id ${id}`);
      }

      try {
        return await this.db.users.change(id, request.body as Partial<Omit<UserEntity, 'id'>>);
      } catch (error) {
        throw reply.notFound(`User with id ${id} not found`);
      }
    }
  );
};

export default plugin;
