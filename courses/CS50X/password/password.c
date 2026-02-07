// Check that a password has at least one lowercase letter, uppercase letter, number and symbol
// Practice iterating through a string
// Practice using the ctype library

#include <cs50.h>
#include <stdio.h>
#include <string.h>
#include <ctype.h>

bool valid(string password);

int main(void)
{
    string password = get_string("Enter your password: ");
    if (valid(password))
    {
        printf("Your password is valid!\n");
    }
    else
    {
        printf("Your password needs at least one uppercase letter, lowercase letter, number and symbol\n");
    }
}

// TODO: Complete the Boolean function below
bool valid(string password)
{
    int upper = 0;
    int lower = 0;
    int nbr = 0;
    int symb = 0;
    int n = strlen(password);

    for(int i = 0; i < n; i++)
    {
        if(isupper(password[i]))
        {
            upper = 1;
        }
        if(islower(password[i]))
        {
            lower = 1;
        }
        if(isdigit(password[i]))
        {
            nbr = 1;
        }
        if((password[i] < 65 && password[i] > 57)|| password[i] < 47 || (password[i] > 90 && password[i] < 97) || password[i] >122)
        {
            symb = 1;
        }
    }

    int sum = 0;
    sum = upper + lower + nbr + symb;

    if( sum != 4)
    {
        return false;
    }
    else
    {
        return true;
    }
}
