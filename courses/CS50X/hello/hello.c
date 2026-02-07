#include <cs50.h>
#include <stdio.h>
int main(void)
{
    string s = get_string("What's your Name? ");
    printf("hello, %s!\n", s);
}
