let Config = {
  // 导出模式
  notExport: 1, // don't export
  export: 2, // export
  exportDefault: 3, // export default
  globalExportMode: 1, // 默认don't export
  linkBreak: '\n', // 换行符
  indent: '  ', // 缩进 默认两个空格
  interfaceName: 'Result', // 导出第一级名称
  interfaceNamePrefix: 'I',// 接口名称前缀
  normalTypes: ['string', 'number', 'boolean'] // 基本类型
}
// 处理数组
let objs = [];
let interfaceNames = [];

/**
 * 获取接口名称
 * @param name 返回字段key
 * @returns {string} 返回处理过的名称
 */
function _getOnlyInterfaceName(name) {
  if (!interfaceNames.includes(name)) {
    return name;
  }
  // 取最后一位
  let lastCharacter = name.slice(-1)
  if (lastCharacter >= '0' && lastCharacter <= '9') {
    lastCharacter = parseInt(lastCharacter) + 1;
    return _getOnlyInterfaceName(name.substring(0, name.length - 1) + lastCharacter)
  } else {
    return _getOnlyInterfaceName(name + '1');
  }
}

function _getBaseName(key) {
  const firstName = key.substring(0, 1);
  const lastName = key.substring(1);
  return firstName.toUpperCase() + lastName;
}

function _getInterfaceName(key) {
  const arr = key.split('_');
  for (let i = 0; i < arr.length; i++) {
    arr[i] = _getBaseName(arr[i]);
  }
  let fullName = arr.join('');
  fullName = Config.interfaceNamePrefix + _getBaseName(fullName)
  fullName = _getOnlyInterfaceName(fullName)
  interfaceNames.push(fullName)
  return fullName;
}

/**
 * 如果是导出为默认，只能导出最外一级
 * @param name
 * @returns {string}
 * @private
 */
function _getRenderInterface(name) {
  if ((Config.globalExportMode === Config.exportDefault && name === Config.interfaceNamePrefix + Config.interfaceName) ||
    name === Config.interfaceNamePrefix + Config.interfaceName) { // export default 只能导出第一级
    return `${Config.globalExportMode === Config.export ? 'export ' : Config.globalExportMode === Config.exportDefault ? 'export default ' : ''}interface`;
  }
  return `${Config.globalExportMode === Config.export ? 'export ' : ''}interface;`
}

function __getRenderInterfaceName(name) {
  return name;
}

function _getRenderLeft() {
  return `{${Config.linkBreak}`;
}

function _getRenderRight() {
  return `}${Config.linkBreak}`
}

function _getRenderKey(key) {
  return key;
}

function _getRenderValue(value) {
  return ` ${value};${Config.linkBreak}`;
}

/**
 * 判断数组是否为普通类型数组
 * @param arr
 * @returns {string}
 */
function _isBaseType(arr) {
  // 判断数组是否
  let type = typeof arr[0];
  for (let i = 1; i < arr.length; i++) {
    if (type !== typeof arr[i]) {
      return 'any';
    }
  }
  return type;
}

/**
 * 处理数组
 * @param json 包含当前数组的json对象
 * @param key 数组对应的key
 * @param inters 拼接字符串
 * @param indent 缩进
 * @returns {*}
 */
function _handleArray(json, key, inters, indent) {
  if (json[key].length === 0) {
    inters += `${indent}${_getRenderKey(key)}:${_getRenderValue('any[]')}`;
  } else {
    // 如果是个空数组或者数组里面为非对象
    if (json[key][0] instanceof Array) {
      // 判断数组是否都为boolean number string等基本类型
      inters += `${indent}${_getRenderKey(key)}:${_getRenderValue('any[]')}`;
    } else {
      // 有可能是对象也有可能是普通类型，如果是对象，类型按照第一个元素类型定义，如果都为普通类型，则指定为具体类型数组
      // 否则为any数组
      // 判断是否为 [1,2,3]形式处理
      if (Config.normalTypes.includes(typeof json[key][0])) {
        const type = _isBaseType(json[key])
        inters += `${indent}${_getRenderKey(key)}: ${_getRenderValue(type + '[]')}`;
      } else {
        const interfaceName = _getInterfaceName(key)
        inters += `${indent}${_getRenderKey(key)}: ${_getRenderValue(interfaceName + '[]')}`;
        objs.push({
          key: interfaceName,
          value: json[key][0]
        });
      }
    }
  }
  return inters;
}

/**
 * 处理json
 * @param json 待处理json
 * @param name 接口名字
 * @param inters 拼接的字符串
 * @param first 是否为第一级
 * @param ind 缩进方式 默认一个tab
 * @returns {*}
 */
function _parseJson(json, name, inters, first = true, ind = Config.indent) {
  const keys = Reflect.ownKeys(json);
  if (!keys.length) { // 判断是否有key
    inters += `${_getRenderInterface(name)} ${__getRenderInterfaceName(name)} ${_getRenderLeft()}`
    inters += _getRenderRight();
    return inters;
  }
  if (!inters && first) {
    inters += `${_getRenderInterface(name)} ${__getRenderInterfaceName(name)} ${_getRenderLeft()}`
  } else if (!inters && !first) {
    inters += _getRenderLeft();
  }
  let type;
  for (const key of keys) {
    // 判断值类型
    type = typeof json[key];
    if (Config.normalTypes.includes(type)) {
      inters += `${ind}${_getRenderKey(key)}:${_getRenderValue(type)}`;
    } else if (json[key] instanceof Array) {
      inters = _handleArray(json, key, inters, ind);
    } else if (json[key] instanceof Object) {
      // inters += `${ind}${_getRenderKey(key)}: ${_parseJson(json[key], key, '', false, ind + ind)}`;
      const interfaceName = _getInterfaceName(key)
      inters += `${Config.indent}${_getRenderKey(key)}: ${interfaceName};${Config.linkBreak}`;
      objs.push({
        key: interfaceName,
        value: json[key]
      });
    }
  }
  if (first) {
    inters += _getRenderRight();
  } else {
    inters += Config.indent + _getRenderRight();
  }
  return inters;
}

/**
 * 导出接口定义
 * @param res json字符串
 * @param options
 * @returns {*} 结果
 */
module.exports = function interfaceDefinition(res, options = {}) {
  // 合并全局配置
  Config = Object.assign(Config, options)
  let result;
  objs = [];
  interfaceNames = [];
  try {
    const json = typeof  res === 'string' ? JSON.parse(res) : res;
    result = _parseJson(json, _getInterfaceName(Config.interfaceName), '', true);
    for (const obj of objs) {
      result += Config.linkBreak
      result += _parseJson(obj.value, obj.key, '', true);
    }
  } catch (e) {
    result = e.message;
  }
  return result;
}

