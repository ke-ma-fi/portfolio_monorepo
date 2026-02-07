import csv
import sys


def main():

    # TODO: Check for command-line usage
    if len(sys.argv) != 3:
        print("python dna.py data.csv sequence.txt")

    # TODO: Read database file into a variable
    db = []

    with open (sys.argv[1]) as file:
        reader = csv.DictReader(file)
        for data in reader:
            db.append(data)

    # TODO: Read DNA sequence file into a variable
    sq = ""
    with open (sys.argv[2]) as file:
        sq = file.readline()

    # TODO: Find longest match of each STR in DNA sequence
    subs = []
    for key in db[0].keys() - {"name"}:
        subs.append(key)

    comp_sq = {}
    for sub in subs:
        comp_sq[sub] = longest_match(sq, sub)

    # TODO: Check database for matching profiles
    global_count = 0
    for dict in db:
        match_count = 0
        for sub in subs:
            if comp_sq[sub] == int(dict[sub]):
                match_count += 1
        if match_count == len(subs):
            dict["match"] = 1
            global_count += 1

    if global_count == 0:
        print("No match")
        return

    for dict in db:
        if "match" in dict.keys():
            print(f"{dict["name"]}")
    return


def longest_match(sequence, subsequence):
    """Returns length of longest run of subsequence in sequence."""

    # Initialize variables
    longest_run = 0
    subsequence_length = len(subsequence)
    sequence_length = len(sequence)

    # Check each character in sequence for most consecutive runs of subsequence
    for i in range(sequence_length):

        # Initialize count of consecutive runs
        count = 0

        # Check for a subsequence match in a "substring" (a subset of characters) within sequence
        # If a match, move substring to next potential match in sequence
        # Continue moving substring and checking for matches until out of consecutive matches
        while True:

            # Adjust substring start and end
            start = i + count * subsequence_length
            end = start + subsequence_length

            # If there is a match in the substring
            if sequence[start:end] == subsequence:
                count += 1

            # If there is no match in the substring
            else:
                break

        # Update most consecutive matches found
        longest_run = max(longest_run, count)

    # After checking for runs at each character in seqeuence, return longest run found
    return longest_run


main()
