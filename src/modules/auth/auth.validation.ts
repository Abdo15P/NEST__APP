import z from 'zod'

export const signupValidation= z.strictObject({
    username: z.string().min(2),
    email: z.email(),
    password: z.string().regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/),
    confirmPassword:z.string().regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/),
}).superRefine((data,ctx)=>{
    if(data.confirmPassword !== data.password){
        ctx.addIssue({
            code:"custom",
            message:"passowrd and confirmPassowrd mismatch",
            path:['confirmPassword']
        })
    }
})