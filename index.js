const { Engine, Render, Runner, World, Bodies, Body, Events } = Matter;

const cellsHorizontal = 8;
const cellsVertical = 7;
const width = window.innerWidth;
const height = window.innerHeight;

const unitLengthX = width / cellsHorizontal;
const unitLengthY = height / cellsVertical;

const engine = Engine.create();
engine.world.gravity.y = 0;
const { world } = engine;
const render = Render.create({
    element: document.body,
    engine: engine,
    options: {
        wireframes: false,
        width,
        height
    }
});

Render.run(render);
Runner.run(Runner.create(), engine);

//walls
const walls = [
    Bodies.rectangle(width / 2, 0, width, 5, { isStatic: true }),
    Bodies.rectangle(width / 2, height, width, 5, { isStatic: true }),
    Bodies.rectangle(0, height / 2, 5, height, { isStatic: true }),
    Bodies.rectangle(width, height / 2, 5, height, { isStatic: true }),
];
World.add(world, walls);

//generate maze

const shuffle = arr => {
    let counter = arr.length;

    while (counter > 0) {
        const index = Math.floor(Math.random() * counter);

        counter--;

        const temp = arr[counter];
        arr[counter] = arr[index];
        arr[index] = temp;
    };
    return arr;
}

const grid = Array(cellsVertical).fill(null).map(() => Array(cellsHorizontal).fill(false));

const verticals = Array(cellsVertical)
    .fill(null)
    .map(() => Array(cellsHorizontal - 1).fill(false));

const horizontals = Array(cellsVertical - 1)
    .fill(null)
    .map(() => Array(cellsHorizontal).fill(false));

const startRow = Math.floor(Math.random() * cellsVertical);
const startColumn = Math.floor(Math.random() * cellsHorizontal);

const stepThroughCell = (row, column) => {
    // if i visited the cell at [row, coloumn], then return
    if (grid[row][column]) {
        return;
    }

    // martk this cell as visited
    grid[row][column] = true;

    // assamble randomly-ordered list of neighbors
    const neighbors = shuffle([
        [row - 1, column, 'up'],
        [row, column + 1, 'right'],
        [row + 1, column, 'down'],
        [row, column - 1, 'left']
    ]);
    // or each neighbor
    for (let neighbor of neighbors) {
        const [nextRow, nextColumn, direction] = neighbor;

        // see if that neighbors is ouf of bounds
        if (
            nextRow < 0 ||
            nextRow >= cellsVertical ||
            nextColumn < 0 ||
            nextColumn >= cellsHorizontal
        ) {
            continue;
        }
        // if we visited this neighbor, continue o next neighbor
        if (grid[nextRow][nextColumn]) {
            continue;
        }
        // remove a wall from either horizontals and verticals
        if (direction === 'left') {
            verticals[row][column - 1] = true;
        } else if (direction === 'rigth') {
            verticals[row][column] = true;
        } else if (direction === 'up') {
            horizontals[row - 1][column] = true;
        } else if (direction === 'down') {
            horizontals[row][column] = true;
        }
        stepThroughCell(nextRow, nextColumn);
    }
    //visit the next cell
};

stepThroughCell(startRow, startColumn);

horizontals.forEach((row, rowIndex) => {
    row.forEach((open, coloumnIndex) => {
        if (open) {
            return;
        }

        const wall = Bodies.rectangle(
            coloumnIndex * unitLengthX + unitLengthX / 2,
            rowIndex * unitLengthY + unitLengthY,
            unitLengthX,
            5,
            {

                label: 'wall',
                isStatic: true,
                render: {
                    fillStyle: 'red'
                }
            }
        );
        World.add(world, wall)
    });
});

verticals.forEach((row, rowIndex) => {
    row.forEach((open, coloumnIndex) => {
        if (open) {
            return;
        }

        const wall = Bodies.rectangle(
            coloumnIndex * unitLengthX + unitLengthX,
            rowIndex * unitLengthY + unitLengthY / 2,
            5,
            unitLengthY,
            {
                label: 'wall',
                isStatic: true,
                render: {
                    fillStyle: 'red'
                }
            }
        );
        World.add(world, wall);
    });
});

//Goal
const goal = Bodies.rectangle(
    width - unitLengthX / 2,
    height - unitLengthY / 2,
    unitLengthX * .7,
    unitLengthY * .7,
    {
        label: 'goal',
        isStatic: true,
        render: {
            fillStyle: 'green'
        }
    }
);
World.add(world, goal);

//ball
const radius = Math.min((unitLengthX, unitLengthY)) / 4;
const ball = Bodies.circle(
    unitLengthX / 2,
    unitLengthY / 2,
    radius,
    {
        label: 'ball',
        render: {
            fillStyle: 'blue'
        }
    }
);
World.add(world, ball)

document.addEventListener('keydown', event => {
    const { x, y } = ball.velocity;

    if (event.keyCode === 87) {
        Body.setVelocity(ball, { x, y: y - 5 });
    }

    if (event.keyCode === 68) {
        Body.setVelocity(ball, { x: x + 5, y });
    }

    if (event.keyCode === 83) {
        Body.setVelocity(ball, { x, y: y + 5 });
    }

    if (event.keyCode === 65) {
        Body.setVelocity(ball, { x: x - 5, y });
    }
})

Events.on(engine, 'collisionStart', event => {
    event.pairs.forEach(collision => {
        const labels = ['ball', 'goal'];

        if (labels.includes(collision.bodyA.label) &&
            labels.includes(collision.bodyB.label)
        ) {
            document.querySelector('.winner').classList.remove('hidden');
            world.gravity.y = 1;
            world.bodies.forEach(body => {
                if (body.label === 'wall') {
                    Body.setStatic(body, false);
                }
            })
        }
    })
})
