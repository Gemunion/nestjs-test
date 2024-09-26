import { Test, TestingModule } from "@nestjs/testing";
import { TypeOrmModule } from "@nestjs/typeorm";
import { Logger, ConflictException } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { v4 } from "uuid";

import { generateUserCreateDto } from "../common/test";
import { DatabaseModule } from "../database/database.module";
import { UserService } from "./user.service";
import { UserSeedService } from "./user.seed.service";
import { UserSeedModule } from "./user.seed.module";
import { UserEntity } from "./user.entity";
import { UserStatus } from "./interfaces";

describe("UserService", () => {
  let userService: UserService;
  let userSeedService: UserSeedService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [
        ConfigModule.forRoot({
          envFilePath: `.env`,
        }),
        DatabaseModule,
        TypeOrmModule.forFeature([UserEntity]),
        UserSeedModule,
      ],
      providers: [Logger, UserService, UserSeedService],
    }).compile();

    userService = module.get<UserService>(UserService);
    userSeedService = module.get<UserSeedService>(UserSeedService);
  });

  afterEach(async () => {
    await userSeedService.tearDown();
  });

  it("should be defined", () => {
    expect(userService).toBeDefined();
  });

  describe("createPasswordHash", () => {
    it("should generate password hash", () => {
      const hash = userService.createPasswordHash("My5up3r5tr0ngP@55w0rd");
      expect(hash).toEqual("92f357f4a898825de204b25fffec4a0a1ca486ad1e25643502e33b5ebeefc3ff");
    });
  });

  describe("create", () => {
    it("create user (ConflictException)", async () => {
      const entities = await userSeedService.setup();
      await expect(userService.create(generateUserCreateDto({ email: entities.users[0].email }))).rejects.toThrow(
        ConflictException,
      );
    });

    it("create user", async () => {
      const userEntity = await userService.create(generateUserCreateDto());
      expect(userEntity).toBeDefined();
    });
  });

  describe("update", () => {
    it("should update email", async () => {
      const entities = await userSeedService.setup();
      const email = `trejgun+${v4()}@gmail.com`;
      const userEntity = await userService.update({ id: entities.users[0].id }, { email });
      expect(userEntity.email).toEqual(email);
      expect(userEntity.status).toEqual(UserStatus.PENDING);
    });
  });
});
