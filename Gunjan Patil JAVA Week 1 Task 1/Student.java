import java.util.ArrayList;
import java.util.Scanner;

public class Student {

    int id;
    String name;
    int age;

    Student(int id, String name, int age) {
        this.id = id;
        this.name = name;
        this.age = age;
    }
@Override
    public String toString() {
        return "ID: " + id + " | Name: " + name + " | Age: " + age;
    }

    static ArrayList<Student> students = new ArrayList<>();
    static Scanner sc = new Scanner(System.in);

    public static void main(String[] args) {

        while (true) {

            System.out.println("\n===== STUDENT MANAGEMENT SYSTEM =====");
            System.out.println("1. Add Student");
            System.out.println("2. View Students");
            System.out.println("3. Update Student");
            System.out.println("4. Delete Student");
            System.out.println("5. Search Student");
            System.out.println("6. Exit");
            System.out.print("Enter Choice: ");

            int choice = sc.nextInt();

            switch (choice) {

                case 1:
                    addStudent();
                    break;

                case 2:
                    viewStudents();
                    break;

                case 3:
                    updateStudent();
                    break;

                case 4:
                    deleteStudent();
                    break;

                case 5:
                    searchStudent();
                    break;

                case 6:
                    System.out.println("Thank You!");
                    System.exit(0);

                default:
                    System.out.println("Invalid Choice!");
            }
        }
    }

    static void addStudent() {

        System.out.print("Enter ID: ");
        int id = sc.nextInt();
        sc.nextLine();

        System.out.print("Enter Name: ");
        String name = sc.nextLine();

        System.out.print("Enter Age: ");
        int age = sc.nextInt();

        students.add(new Student(id, name, age));

        System.out.println("Student Added Successfully!");
    }

    static void viewStudents() {

        if (students.isEmpty()) {
            System.out.println("No Student Records Found!");
            return;
        }

        System.out.println("\n----- Student Records -----");

        for (Student s : students) {
            System.out.println(s);
        }
    }

    static void updateStudent() {

        System.out.print("Enter Student ID to Update: ");
        int id = sc.nextInt();
        sc.nextLine();

        for (Student s : students) {

            if (s.id == id) {

                System.out.print("Enter New Name: ");
                s.name = sc.nextLine();

                System.out.print("Enter New Age: ");
                s.age = sc.nextInt();

                System.out.println("Student Updated Successfully!");
                return;
            }
        }

        System.out.println("Student Not Found!");
    }

    static void deleteStudent() {

        System.out.print("Enter Student ID to Delete: ");
        int id = sc.nextInt();

        for (int i = 0; i < students.size(); i++) {

            if (students.get(i).id == id) {

                students.remove(i);
                System.out.println("Student Deleted Successfully!");
                return;
            }
        }

        System.out.println("Student Not Found!");
    }

    static void searchStudent() {

        System.out.print("Enter Student ID to Search: ");
        int id = sc.nextInt();

        for (Student s : students) {

            if (s.id == id) {

                System.out.println("\nStudent Found:");
                System.out.println(s);
                return;
            }
        }

        System.out.println("Student Not Found!");
    }
}