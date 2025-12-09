
import readline from "readline"
import {auth, authConfig} from "@/lib/auth/auth";
import {betterAuth} from "better-auth";
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

function booleanQuestion(question: string) {
    return new Promise<boolean>((resolve) => {
        rl.question(question + " (y/n): ", (answer) => {
            const normalized = answer.trim().toLowerCase();
            if (normalized === 'y' || normalized === 'yes') {
                resolve(true);
            } else {
                resolve(false);
            }
        });
    });
}


const main = async () => {
    const name = await askQuestion("Enter user name: ") as string;
    const email = await askQuestion("Enter user email: ") as string;
    const password = await askQuestion("Enter user password: ") as string;
    const admin = await booleanQuestion("Is the user an admin?");
    rl.close();

    const modifiedAuthConfig = {
        ...authConfig,
        emailAndPassword: {
            ...authConfig.emailAndPassword,
            disableSignUp: false
        },
        user: {
            additionalFields: {
                ...authConfig.user.additionalFields,
                role: {
                    ...authConfig.user.additionalFields.role,
                    required: true,
                    input: true,
                }
            }
        },
    }

    const auth = betterAuth(modifiedAuthConfig);

    await auth.api.signUpEmail({
        body: {
            name,
            email,
            password,
            role: admin? "ADMIN" : "USER"
        }
    });

    console.log("User created");
};

main();
