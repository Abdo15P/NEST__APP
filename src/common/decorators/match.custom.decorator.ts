import { ValidationOptions } from './../../../node_modules/class-validator/types/decorator/ValidationOptions.d';
import { registerDecorator, ValidationArguments, ValidatorConstraint, ValidatorConstraintInterface } from "class-validator";

@ValidatorConstraint({name:'match_between_fields',async:false})
export class MatchBetweenFields<T=any> implements ValidatorConstraintInterface{
    validate(value:T, args:ValidationArguments){
        console.log({
            value,
            args,
            matchWith:args.constraints[0],
            matchWithValue:args.object[args.constraints[0]]
        })
        return value === args.object[args.constraints[0]]
    }
    defaultMessage(validationArguments?: ValidationArguments): string {
        return `failed to match src field:: ${validationArguments?.property} with target field:: ${validationArguments?.constraints[0]}`
    }
}

export function IsMatch<T=any>(
    constraints:string[],
    validationOptions?:ValidationOptions
){
    return function(object:Object,propertyName:string){
        registerDecorator({
            target:object.constructor,
            propertyName: propertyName,
            options:validationOptions,
            constraints,
            validator:MatchBetweenFields<T>
        })
    }
}