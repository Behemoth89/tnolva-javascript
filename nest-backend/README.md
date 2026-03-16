<p align="center">
  <a href="http://nestjs.com/" target="blank"><img src="https://nestjs.com/img/logo-small.svg" width="120" alt="Nest Logo" /></a>
</p>

[circleci-image]: https://img.shields.io/circleci/build/github/nestjs/nest/master?token=abc123def456
[circleci-url]: https://circleci.com/gh/nestjs/nest

  <p align="center">A progressive <a href="http://nodejs.org" target="_blank">Node.js</a> framework for building efficient and scalable server-side applications.</p>
    <p align="center">
<a href="https://www.npmjs.com/~nestjscore" target="_blank"><img src="https://img.shields.io/npm/v/@nestjs/core.svg" alt="NPM Version" /></a>
<a href="https://www.npmjs.com/~nestjscore" target="_blank"><img src="https://img.shields.io/npm/l/@nestjs/core.svg" alt="Package License" /></a>
<a href="https://www.npmjs.com/~nestjscore" target="_blank"><img src="https://img.shields.io/npm/dm/@nestjs/common.svg" alt="NPM Downloads" /></a>
<a href="https://circleci.com/gh/nestjs/nest" target="_blank"><img src="https://img.shields.io/circleci/build/github/nestjs/nest/master" alt="CircleCI" /></a>
<a href="https://discord.gg/G7Qnnhy" target="_blank"><img src="https://img.shields.io/badge/discord-online-brightgreen.svg" alt="Discord"/></a>
<a href="https://opencollective.com/nest#backer" target="_blank"><img src="https://opencollective.com/nest/backers/badge.svg" alt="Backers on Open Collective" /></a>
<a href="https://opencollective.com/nest#sponsor" target="_blank"><img src="https://opencollective.com/nest/sponsors/badge.svg" alt="Sponsors on Open Collective" /></a>
  <a href="https://paypal.me/kamilmysliwiec" target="_blank"><img src="https://img.shields.io/badge/Donate-PayPal-ff3f59.svg" alt="Donate us"/></a>
    <a href="https://opencollective.com/nest#sponsor"  target="_blank"><img src="https://img.shields.io/badge/Support%20us-Open%20Collective-41B883.svg" alt="Support us"></a>
  <a href="https://twitter.com/nestframework" target="_blank"><img src="https://img.shields.io/twitter/follow/nestframework.svg?style=social&label=Follow" alt="Follow us on Twitter"></a>
</p>
  <!--[![Backers on Open Collective](https://opencollective.com/nest/backers/badge.svg)](https://opencollective.com/nest#backer)
  [![Sponsors on Open Collective](https://opencollective.com/nest/sponsors/badge.svg)](https://opencollective.com/nest#sponsor)-->

## Description

[Nest](https://github.com/nestjs/nest) framework TypeScript starter repository.

## API Versioning

This API uses URL-based versioning. All endpoints are prefixed with `/api/v1/`.

### Base URL
```
http://localhost:3000/api/v1
```

### API Endpoints

#### Authentication
- `POST /api/v1/auth/register` - Register a new user
- `POST /api/v1/auth/login` - User login
- `POST /api/v1/auth/refresh` - Refresh access token
- `POST /api/v1/auth/switch-company` - Switch active company

#### Users
- `GET /api/v1/users` - Get all users
- `GET /api/v1/users/deleted` - Get soft-deleted users
- `GET /api/v1/users/:id` - Get user by ID
- `POST /api/v1/users/:id/soft-delete` - Soft delete a user
- `POST /api/v1/users/:id/restore` - Restore a soft-deleted user
- `DELETE /api/v1/users/:id` - Hard delete a user

#### Health
- `GET /api/v1/health` - Health check

#### Application
- `GET /api/v1` - Application info

#### Companies
- `GET /api/v1/companies` - Get all companies (admin+)
- `GET /api/v1/companies/:id` - Get company by ID
- `POST /api/v1/companies` - Create new company
- `PATCH /api/v1/companies/:id` - Update company
- `DELETE /api/v1/companies/:id` - Delete company (owner only)
- `POST /api/v1/companies/:id/transfer-ownership` - Transfer ownership (owner only)

#### Company Users
- `GET /api/v1/companies/:id/users` - List company users (admin+)
- `PATCH /api/v1/companies/:id/users/:userId/role` - Update user role (admin+)
- `DELETE /api/v1/companies/:id/users/:userId` - Remove user from company (admin+)

#### Invitations
- `POST /api/v1/companies/:id/invitations` - Create invitation (admin+)
- `GET /api/v1/companies/:id/invitations` - List invitations (admin+)
- `DELETE /api/v1/companies/:id/invitations/:invitationId` - Cancel invitation (admin+)
- `POST /api/v1/companies/:id/invitations/accept` - Accept invitation

### Role-Based Access Control

This API implements role-based access control with three roles:

| Role | Permissions |
|------|-------------|
| **Owner** | Full access to all company operations including deletion and ownership transfer |
| **Admin** | Manage users, create/cancel invitations, cannot delete company or transfer ownership |
| **Member** | Read-only access to company resources |

#### Using Role Guards

Add role guards to controller methods using decorators:

```typescript
import { OwnerGuard } from '../auth/guards/roles/owner-guard.decorator';
import { AdminGuard } from '../auth/guards/roles/admin-guard.decorator';
import { MemberGuard } from '../auth/guards/roles/member-guard.decorator';

@Controller('companies')
export class CompaniesController {
  @Delete(':id')
  @OwnerGuard()
  deleteCompany() {}

  @Post(':id/invitations')
  @AdminGuard()
  createInvitation() {}

  @Get()
  @MemberGuard()
  listCompanies() {}
}
```

**Important:** All role-protected endpoints require the `x-company-id` header to be set.

### API Documentation

Interactive API documentation is available via Swagger UI at:
```
http://localhost:3000/api/docs/v1
```

## Project setup

```bash
$ npm install
```

## Compile and run the project

```bash
# development
$ npm run start

# watch mode
$ npm run start:dev

# production mode
$ npm run start:prod
```

## Run tests

```bash
# unit tests
$ npm run test

# e2e tests
$ npm run test:e2e

# test coverage
$ npm run test:cov
```

## Deployment

When you're ready to deploy your NestJS application to production, there are some key steps you can take to ensure it runs as efficiently as possible. Check out the [deployment documentation](https://docs.nestjs.com/deployment) for more information.

If you are looking for a cloud-based platform to deploy your NestJS application, check out [Mau](https://mau.nestjs.com), our official platform for deploying NestJS applications on AWS. Mau makes deployment straightforward and fast, requiring just a few simple steps:

```bash
$ npm install -g @nestjs/mau
$ mau deploy
```

With Mau, you can deploy your application in just a few clicks, allowing you to focus on building features rather than managing infrastructure.

## Resources

Check out a few resources that may come in handy when working with NestJS:

- Visit the [NestJS Documentation](https://docs.nestjs.com) to learn more about the framework.
- For questions and support, please visit our [Discord channel](https://discord.gg/G7Qnnhy).
- To dive deeper and get more hands-on experience, check out our official video [courses](https://courses.nestjs.com/).
- Deploy your application to AWS with the help of [NestJS Mau](https://mau.nestjs.com) in just a few clicks.
- Visualize your application graph and interact with the NestJS application in real-time using [NestJS Devtools](https://devtools.nestjs.com).
- Need help with your project (part-time to full-time)? Check out our official [enterprise support](https://enterprise.nestjs.com).
- To stay in the loop and get updates, follow us on [X](https://x.com/nestframework) and [LinkedIn](https://linkedin.com/company/nestjs).
- Looking for a job, or have a job to offer? Check out our official [Jobs board](https://jobs.nestjs.com).

## Support

Nest is an MIT-licensed open source project. It can grow thanks to the sponsors and support by the amazing backers. If you'd like to join them, please [read more here](https://docs.nestjs.com/support).

## Stay in touch

- Author - [Kamil Myśliwiec](https://twitter.com/kammysliwiec)
- Website - [https://nestjs.com](https://nestjs.com/)
- Twitter - [@nestframework](https://twitter.com/nestframework)

## License

Nest is [MIT licensed](https://github.com/nestjs/nest/blob/master/LICENSE).
