import { applyDecorators, UseGuards } from "@nestjs/common";
import { RoleEnum, TokenEnum } from "../enums";
import { AuthenticationGuard } from "../guards/authentication/authentication.guard";
import { AuthorizationGuard } from "../guards/authorization/authorization.guard";
import { Roles } from "./role.decorator";
import { Token } from "./token.type.decorator";

export function Auth(roles:RoleEnum[], type:TokenEnum=TokenEnum.access){
    return applyDecorators(
        Token(type),
        Roles(roles),
        UseGuards(AuthenticationGuard,AuthorizationGuard)
    )
}