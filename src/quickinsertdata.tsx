import { Action, ActionPanel, Form, Icon, List, useNavigation, Detail, LaunchProps, Alert } from "@raycast/api";
import { parseSql, generateSql, getDataBySort } from "./utils";
import { useState } from "react";

interface Todo {
  [key: string]: unknown; // 允许任意数量的动态字段
}

/**
 * 初始化
 */
export default function Command() {
  const { push } = useNavigation();
  const [sql, setSql] = useState<string>(`INSERT INTO sdep_tender_fees (
          id,
          title,
          isCompleted,
         )
         VALUES
          (
           252107,
           'TEF20241101010005',
           123
          ),
          (
           252108,
           'TEF20241101010006',
           1234
          )`);


  const handleSqlSubmit = (inputSql: string) => {
    try {
      const parsed = parseSql(inputSql);
      setSql(inputSql);
      // setTableData(parsed);
      push(<TodoList data={parsed} />);
    } catch (error) {
      push(
        <Detail markdown={`# 错误\n无法解析 SQL，请检查输入。\n\n${error}`} />
      );
    }
  };

  return (
    <Form
      actions={
        <ActionPanel>
          <Action.SubmitForm title="解析 Sql" onSubmit={({ sqlInput }) => handleSqlSubmit(sqlInput)} />
        </ActionPanel>
      }
    >
      <Form.TextArea id="sqlInput" title="输入 SQL" defaultValue={sql} placeholder="输入 INSERT SQL..." />
    </Form>
  );
}

// 列表
function TodoList(props: { data: { rowData: { map: (arg0: (i: object, idx: number) => { z__idx: string; }) => Todo[] | (() => Todo[]); }; tableName: Todo[] | (() => Todo[]); }; }) {
  const { push } = useNavigation();
  // 初始化时新增索引
  const [todos, setTodos] = useState<Todo[]>(props.data.rowData.map((i: object, idx: number) => ({...i, z__idx: `line-${idx+1}`})));
  // console.log('todos--', todos);
  const [tableName, setTableName] = useState<Todo[]>(props.data.tableName);

  function handleCreate(todo: Todo) {
   
    if (todo.z__idx) {
      // todo的修改
      const idx = todos.findIndex((i) => i.z__idx === todo.z__idx);
      // console.log('handleCreate', todos, todo, idx);
      if (idx > -1 && todo) {
        const newTodos = [...todos];
        newTodos.splice(idx, 1, getDataBySort(todo));
        // console.log('setTodos- newTodos', newTodos);
        setTodos(newTodos);
      }
    } else {
       // todo的新增
      const newTodos = [...todos, getDataBySort(todo)];
      setTodos(newTodos);
    }
  }

  function handleDelete(index: number) {
    const newTodos = [...todos];
    newTodos.splice(index, 1);
    setTodos(newTodos);
  }

  const handleGenerateSql = () => {
    if (todos) {
      const newSql = generateSql({tableName, rowData: [...todos].map(i => {
        const _item = i;
        delete _item.z__idx;
        return _item;
      })});
      push(<SqlOutput sql={newSql} />);
    }
  };

  return (
    <List
      actions={
        <ActionPanel>
           <GenerateSqlAction onGenerateSql={handleGenerateSql} />
        </ActionPanel>
      }
    >
      {todos.map((todo, index) => (
        <List.Item
          key={index}
          // icon={todo.isCompleted ? Icon.Checkmark : Icon.Circle}
          title={`${index + 1} 行: ${JSON.stringify(todo)}` }
          // title={todo.title}
          actions={
            <ActionPanel>
              <ActionPanel.Section>
                <EditTodoAction formData={todo} onCreate={handleCreate} />
              </ActionPanel.Section>
              <ActionPanel.Section>
                <GenerateSqlAction onGenerateSql={handleGenerateSql} />
              </ActionPanel.Section>
              <ActionPanel.Section>
                <DeleteTodoAction onDelete={() => handleDelete(index)} />
              </ActionPanel.Section>
            </ActionPanel>
          }
        />
      ))}
    </List>
  );
}

// 修改
function CreateTodoForm(props: { formData: object, onCreate: (todo: Todo) => void }) {
  const { pop } = useNavigation();

  function handleSubmit(values: { title: string, id: string,  }) {
    console.log('handleSubmit', values);
    props.onCreate(values);
    pop();
  }

  const { formData } = props || {};
  return (
    <Form
      actions={
        <ActionPanel>
          <Action.SubmitForm title="确定" onSubmit={handleSubmit} />
        </ActionPanel>
      }
    >
      {Object.keys(formData).map((item, idx) => {
        return (
          <Form.TextField
            storeValue={true}
            key={idx}
            id={item}
            title={item}
            value={formData[item]}
            //  value={formData ? formData[item] : ''}
          />
        );
      })}
    </Form>
  );
}

// 编辑
function EditTodoAction(props: { formData: object, onCreate: (todo: Todo) => void }) {
  return (
    <Action.Push
      icon={Icon.Pencil}
      title="编辑"
      shortcut={{ modifiers: ["cmd"], key: "n" }}
      target={<CreateTodoForm formData={props.formData} onCreate={props.onCreate} />}
    />
  );
}

// 删除
function DeleteTodoAction(props: { onDelete: () => void }) {
  return (
    <Action
      icon={Icon.Trash}
      title="Delete Todo"
      shortcut={{ modifiers: ["ctrl"], key: "x" }}
      onAction={props.onDelete}
    />
  );
}

// 删除
function GenerateSqlAction(props: { onGenerateSql: () => void }) {
  return (
    <Action
      icon={Icon.AddPerson}
      title="生成 Sql"
      shortcut={{ modifiers: ["cmd"], key: "r" }}
      onAction={props.onGenerateSql}
    />
  );
}

// SQL输出
function SqlOutput({ sql }: { sql: string }) {
  return (
    <Detail
      markdown={`# 新 SQL\n\n\`\`\`sql\n${sql}\n\`\`\`\n`}
      actions={
        <ActionPanel>
          <Action.CopyToClipboard content={sql} title="复制 Sql 到剪贴板" />
        </ActionPanel>
      }
    />
  );
}