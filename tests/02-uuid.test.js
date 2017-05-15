const uuid = require('uuid');

test('uuid called two times in a row - have different values', () => {
    let uuid1 = uuid.v4(),
        uuid2 = uuid.v4();
    expect(uuid1).not.toBe(uuid2);
});