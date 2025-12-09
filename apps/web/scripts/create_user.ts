
import readline from "readline"
import {auth} from "@/lib/auth";
const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

function askQuestion(question: string) {
    return new Promise((resolve) => {
        rl.question(question, (answer) => {
            resolve(answer);
        });
    });
}


const main = async () => {
    const name = await askQuestion("Enter user name: ") as string;
    const email = await askQuestion("Enter user email: ") as string;
    const password = await askQuestion("Enter user password: ") as string;
    rl.close();

    await auth.api.signUpEmail({
        body: {
            name,
            email,
            password,
        }
    });

    console.log("User created");

};

main();
