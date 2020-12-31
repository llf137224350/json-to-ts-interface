test('空json对象', () => {
  const interfaceDefinition = require('../');
  expect(interfaceDefinition({})).toBe(`interface IResult {
}
`)
});

test('空json字符串', () => {
  const interfaceDefinition = require('../');
  expect(interfaceDefinition("{}")).toBe(`interface IResult {
}
`)
});

test('简单json对象', () => {
  const interfaceDefinition = require('../');
  expect(interfaceDefinition('{"name":"zhangsan","age":18}')).toBe(`interface IResult {
  name: string;
  age: number;
}
`)
});

test('json对象嵌套', () => {
  const interfaceDefinition = require('../');
  expect(interfaceDefinition('{"name":"zhangsan","age":18,"obj":{"name":"zhangsan","age":18}}')).toBe(`interface IResult {
  name: string;
  age: number;
  obj: IObj;
}

interface; IObj {
  name: string;
  age: number;
}
`)
});

test('复杂json对象', () => {
  const interfaceDefinition = require('../');
  const jsonStr = `{"rewardable":true,"setting":{"description":"小礼物走一走，来简书关注我","default_amount":200},"total_rewards_count":2,"reward_buyers":[{"avatar":"https://upload.jianshu.io/users/upload_avatars/24980734/6a3c4ca0-a49b-4c04-bd0e-873680f9d299","slug":"7e41f9591579"},{"avatar":"https://cdn2.jianshu.io/assets/default_avatar/2-9636b13945b9ccf345bc98d0d81074eb.jpg","slug":"2b934bfdf859"}]}`;
  expect(interfaceDefinition(jsonStr)).toBe(`interface IResult {
  rewardable: boolean;
  setting: ISetting;
  total_rewards_count: number;
  reward_buyers:  IRewardBuyers[];
}

interface; ISetting {
  description: string;
  default_amount: number;
}

interface; IRewardBuyers {
  avatar: string;
  slug: string;
}
`)
});
