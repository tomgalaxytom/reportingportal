import os
import pandas as pd


def split_large_csv(input_file, chunk_size=5000):
    """
    Splits a large CSV file into smaller CSV files
    and saves them inside the 'splitcsv' folder.
    """

    if not os.path.exists(input_file):
        print(f"Error: The file '{input_file}' does not exist.")
        return

    try:
        # Create splitcsv folder
        output_folder = "splitcsv"
        os.makedirs(output_folder, exist_ok=True)

        print(f"Loading '{input_file}'...")

        df = pd.read_csv(input_file)

        total_rows = len(df)

        print(f"Total rows found: {total_rows}")
        print(f"Chunk size: {chunk_size}")
        print(f"Output folder: {output_folder}")

        part_num = 1

        for start_idx in range(0, total_rows, chunk_size):

            chunk_df = df.iloc[start_idx:start_idx + chunk_size]

            output_filename = os.path.join(
                output_folder,
                f"emails_part_{part_num}.csv"
            )

            chunk_df.to_csv(
                output_filename,
                index=False
            )

            print(
                f"Saved: {output_filename} "
                f"({len(chunk_df)} rows)"
            )

            part_num += 1

        print("\nCSV Splitting Completed successfully!")

    except Exception as e:
        print(f"An error occurred while splitting the file: {e}")


if __name__ == "__main__":

    target_csv = "large_emails.csv"

    split_large_csv(
        target_csv,
        chunk_size=5000
    )