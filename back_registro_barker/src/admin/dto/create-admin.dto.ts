import { IsNotEmpty, IsString } from "class-validator";

export class CreateAdminDto {

        idAdmin: number     
    
        @IsNotEmpty()
        @IsString()
        adminName: string;    
      
        @IsNotEmpty()
        @IsString()
        email: string;
    
        @IsNotEmpty()
        @IsString()
        password: string;
          
}
