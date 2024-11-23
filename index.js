import express from "express";
import * as fs from "fs";
import authRouter from "./authRouter.js";

const PORT = 3333;
const app = express();
const saltRounds = 10;
app.use(express.json());
app.use("/users", authRouter);
let todos = [];

if (fs.existsSync("todos.json")) {
  const data = fs.readFileSync("todos.json", "utf-8");
  if (data.length > 0) {
    todos = JSON.parse(data);
  }
}

// GET all todos
app.get("/todos", (req, res) => {
  if (todos.length === 0) {
    return res.status(404).json({ error: "No todos found" });
  }

  res.json(todos);
});

// POST a new todo
app.post("/todos", (req, res) => {
  const title = req.body.title;
  if (!title) return res.status(400).send({ message: "Title is not found" });

  const newTodo = {
    id: todos.length > 0 ? todos[todos.length - 1].id + 1 : 1,
    title: title,
    checked: false,
  };
  todos.push(newTodo);

  // Write to file
  fs.writeFileSync("todos.json", JSON.stringify(todos), "utf-8");
  return res.send(newTodo);
});

// GET a specific todo by ID
app.get("/todos/:id", (req, res) => {
  const id = req.params.id;
  if (!id) return res.status(400).send({ message: "Id not found!" });

  const todo = todos.find((item) => item.id === Number(id));
  if (!todo) return res.status(404).send({ message: "Todo not found!" });

  return res.send(todo);
});

// DELETE a todo by ID
app.delete("/todos/:id", (req, res) => {
  const id = req.params.id;
  if (!id) return res.status(400).send({ message: "Id not found!" });

  const index = todos.findIndex((item) => item.id === Number(id));
  if (index === -1) return res.status(404).send({ message: "Todo not found!" });

  const deletedTodo = todos.splice(index, 1);

  // Write updated todos to file
  fs.writeFileSync("todos.json", JSON.stringify(todos), "utf-8");
  return res.send(deletedTodo[0]);
});

// PUT (update) a todo by ID
app.put("/todos/:id", (req, res) => {
  const id = req.params.id;
  if (!id) return res.status(400).send({ message: "Id not found!" });

  const todo = todos.find((item) => item.id === Number(id));
  if (!todo) return res.status(404).send({ message: "Todo not found!" });

  const { title, checked } = req.body;
  if (title !== undefined) todo.title = title;
  if (checked !== undefined) todo.checked = checked;

  // Write updated todos to file
  fs.writeFileSync("todos.json", JSON.stringify(todos), "utf-8");
  return res.send(todo);
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
