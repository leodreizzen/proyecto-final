async function placeholder() {
    while (true) {
        console.log("Worker not implemented yet.");
        await new Promise((resolve) => setTimeout(resolve, 1000));
    }
}

placeholder().catch(console.error);