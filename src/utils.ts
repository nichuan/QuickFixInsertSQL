/*
 * @author: biao.zhu@going-link.com
 * @Date: 2024-11-19 14:15:15
 * @LastEditTime: 2024-11-20 10:31:06
 * @Description: utils
 * @copyright: Copyright (c) 2020, Hand
 */

/**
 * SQL解析
 */
export function parseSql(sql: string) {
  const match = sql.match(/INSERT INTO (\w+)\s*\(([^)]+)\)\s*VALUES\s*\(([^)]+)\)(.*)/s);
  if (!match) throw new Error("无法解析 SQL 语句");

  const [, tableName, columns, firstValues, rest] = match;

  const columnNames = columns
    .split(",")
    .map((c) => c.trim())
    .filter((col) => col);

  const rows = [firstValues, ...(rest.match(/\(([^)]+)\)/g)?.map((v) => v.slice(1, -1)) || [])];

  const rowData = rows
    .map((row) => row.split(",").map((value) => value.trim().replace(/['"]/g, "")))
    .filter((row) => row.some((value) => value.trim() !== ""))
    .map((row) =>
      row.reduce(
        (acc, value, index) => {
          acc[columnNames[index]] = value;
          return acc;
        },
        {} as Record<string, string>,
      ),
    );

  return { tableName, rowData };
}


/**
 * SQL生成
 */
export function generateSql({ tableName, rowData }: { tableName: string; rowData: Array<Record<string, string>> }) {
  if (rowData.length === 0) {
    throw new Error("rowData 不能为空");
  }

  // 获取列名
  const columnNames = Object.keys(rowData[0]);
  const columnsStr = columnNames.join(", ");

  // 构建 VALUES 部分
  const valuesStr = rowData.map((row) => `(${columnNames.map((col) => `'${row[col]}'`).join(", ")})`).join(",\n ");

  // 构建最终 SQL
  return `INSERT INTO ${tableName} (\n ${columnsStr}\n)\nVALUES\n ${valuesStr}`;
}

// 获取排序后的对象
export const getDataBySort = (obj) => {
  const sortTodo = {};
  Object.keys(obj)
    .sort()
    .forEach((i) => (sortTodo[i] = obj[i]));
  return sortTodo;
};
